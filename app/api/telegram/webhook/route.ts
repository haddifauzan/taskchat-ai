import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { formatDeadlineForDb } from "@/utils/date";

// Admin client to bypass RLS for webhook operations (running server-to-server)
function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// AI extraction prompt (shared across providers)
const EXTRACTION_PROMPT = `Kamu adalah asisten AI untuk aplikasi manajemen tugas kuliah (TaskChat AI) untuk mahasiswa Indonesia.
Tugasmu adalah menganalisis pesan dari mahasiswa dalam bahasa Indonesia dan menentukan aksi apa yang ingin mereka lakukan: membuat tugas baru ("create"), memperbarui tugas ("update"), menghapus tugas ("delete"), atau mendeteksi jika pesan tidak valid/tidak sesuai perintah ("invalid").

Tentukan salah satu dari aksi berikut:
1. "create" (Membuat tugas baru)
2. "update" (Memperbarui informasi tugas yang sudah ada seperti nama, deskripsi, deadline, tipe, prioritas, atau status)
3. "delete" (Menghapus tugas yang sudah ada)
4. "invalid" (Pesan tidak dipahami, tidak sesuai perintah, atau instruksi tidak lengkap/bias)

Ketentuan Ekstraksi Output JSON:
- "action": Wajib diisi salah satu dari: "create", "update", "delete", "invalid".
- "search_query": Wajib diisi untuk aksi "update" dan "delete". Tentukan nama tugas, mata kuliah, atau kata kunci tugas lama yang ingin dicari (misal: jika user berkata "ubah deadline tugas kalkulus ke besok", maka search_query adalah "kalkulus"). Jangan sertakan kata kerja seperti "hapus", "ubah", "selesaikan", "selesai" di dalam search_query.
- "task_data": Wajib diisi untuk aksi "create" dan (jika ada perubahan) untuk "update". Hanya isi field yang terdeteksi secara eksplisit:
  * "title": Judul/nama tugas baru (atau judul baru jika diupdate)
  * "course": Nama mata kuliah yang disebutkan
  * "description": Deskripsi singkat tugas
  * "deadline": Tanggal deadline dalam format ISO 8601 (YYYY-MM-DD atau YYYY-MM-DDTHH:mm:ss). Jika berupa waktu relatif seperti "besok", "lusa", "jumat depan", hitung berdasarkan tanggal Hari Ini yang diberikan. Jika tidak disebutkan, isi null.
  * "type": Kategori tugas ("tugas", "quiz", "tubes", "presentasi", "praktikum")
  * "priority": Prioritas tugas ("high", "medium", "low").
    - Jika membuat tugas baru: otomatis "high" jika deadline < 3 hari, "medium" jika < 7 hari, "low" jika > 7 hari atau tidak ada deadline.
    - Jika update: isi jika diminta secara eksplisit (misal: "ubah prioritas tugas kalkulus jadi high").
  * "status": Status tugas ("pending", "in_progress", "completed").
    - Jika user berkata "selesai", "sudah dikerjakan", "telah beres", "tandai selesai" untuk suatu tugas, maka status menjadi "completed".
    - Jika user berkata "sedang dikerjakan", "mulai kerjakan", "in progress", maka status menjadi "in_progress".
    - Jika user berkata "belum dikerjakan", "pending", maka status menjadi "pending".
- "feedback_message": Wajib diisi jika action adalah "invalid". Berikan pesan feedback yang ramah, sopan, dan terstruktur dalam bahasa Indonesia untuk memandu user tentang format perintah yang benar (menambah, mengubah, menghapus tugas) dengan contoh konkret.

Jawab HANYA dengan JSON valid, tanpa markdown atau penjelasan tambahan.`;

interface ExtractedTaskAction {
  action: "create" | "update" | "delete" | "invalid";
  search_query?: string;
  task_data?: {
    title?: string;
    course?: string;
    deadline?: string | null;
    description?: string | null;
    type?: "tugas" | "quiz" | "tubes" | "presentasi" | "praktikum";
    priority?: "high" | "medium" | "low";
    status?: "pending" | "in_progress" | "completed";
  };
  feedback_message?: string;
}

async function extractTaskFromMessage(message: string): Promise<ExtractedTaskAction | null> {
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  const today = new Date().toISOString().split("T")[0];

  const userPrompt = `Hari ini: ${today}\n\nPesan mahasiswa:\n"${message}"\n\nEkstrak aksi dan informasi tugas dari pesan di atas sesuai instruksi sistem.`;

  // Try Groq first
  if (groqKey) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${groqKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: EXTRACTION_PROMPT },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.1,
          max_tokens: 400,
          response_format: { type: "json_object" },
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const content = json.choices?.[0]?.message?.content;
        if (content) return JSON.parse(content);
      }
    } catch {
      // Fall through to Gemini
    }
  }

  // Fallback to Google Gemini (gratis via AI Studio)
  if (geminiKey) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: EXTRACTION_PROMPT }],
            },
            contents: [
              { role: "user", parts: [{ text: userPrompt }] },
            ],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 400,
              responseMimeType: "application/json",
            },
          }),
        }
      );

      if (res.ok) {
        const json = await res.json();
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return JSON.parse(text);
      }
    } catch {
      return null;
    }
  }

  return null;
}

async function sendTelegramMessage(chatId: number, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
}

export async function GET() {
  return Response.json({
    status: "active",
    message: "TaskChat AI Telegram Webhook is active and running. Waiting for POST updates from Telegram.",
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  // Verify webhook secret
  const secret = request.headers.get("x-telegram-bot-api-secret-token");
  if (process.env.TELEGRAM_WEBHOOK_SECRET && secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const message = body?.message;
  if (!message?.text || !message?.from?.id) {
    return Response.json({ ok: true });
  }

  const telegramId = message.from.id;
  const chatId = message.chat.id;
  const text = message.text.trim();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Public commands (no auth check needed)
  if (text === "/start" || text === "/help") {
    await sendTelegramMessage(
      chatId,
      `👋 Halo! Saya <b>TaskChat AI Bot</b>.\n\n` +
      `Saya bisa membantu kamu mengelola tugas kuliah langsung via Telegram menggunakan percakapan biasa.\n\n` +
      `💡 <b>Contoh Penggunaan AI:</b>\n` +
      `• <b>Tambah Tugas:</b> <i>"Tugas Fisika membuat resume bab 2 deadline senin depan"</i>\n` +
      `• <b>Ubah Detail Tugas:</b> <i>"Ubah deadline tugas membuat resume Fisika jadi besok"</i>\n` +
      `• <b>Ubah Status Tugas:</b> <i>"Tandai tugas resume Fisika sedang dikerjakan"</i> atau <i>"Tugas resume Fisika sudah selesai"</i>\n` +
      `• <b>Hapus Tugas:</b> <i>"Hapus tugas resume Fisika"</i>\n\n` +
      `📋 <b>Daftar Perintah Bot:</b>\n` +
      `/today - Tugas hari ini\n` +
      `/upcoming - Deadline terdekat (7 hari)\n` +
      `/tasks - Semua tugas aktif (belum selesai)\n` +
      `/courses - Daftar mata kuliah\n` +
      `/stats - Statistik tugas kuliahmu\n` +
      `/help - Tampilkan bantuan ini\n\n` +
      `Lihat visualisasi dashboard & kelola tugas lengkap di: <a href="${appUrl}">TaskChat AI Dashboard</a>`
    );
    return Response.json({ ok: true });
  }

  const supabase = createAdminClient();

  // Find user by telegram_id
  const { data: connection } = await supabase
    .from("telegram_connections")
    .select("user_id")
    .eq("telegram_id", telegramId)
    .single();

  if (!connection) {
    await sendTelegramMessage(
      chatId,
      `❌ Akunmu belum terhubung ke TaskChat AI.\n\nLogin dan hubungkan Telegram di: <a href="${appUrl}/settings">${appUrl}/settings</a>`
    );
    return Response.json({ ok: true });
  }

  // Handle Authenticated Commands
  if (text.startsWith("/")) {
    const cmd = text.toLowerCase().split(" ")[0];
    const now = new Date();

    if (cmd === "/today") {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

      const { data: tasks } = await supabase
        .from("assignments")
        .select("*, courses(name)")
        .eq("user_id", connection.user_id)
        .neq("status", "completed")
        .gte("deadline", todayStart)
        .lt("deadline", todayEnd)
        .order("deadline");

      if (!tasks || tasks.length === 0) {
        await sendTelegramMessage(chatId, "🎉 <b>Tidak ada tugas untuk hari ini!</b>\nNikmati harimu.");
      } else {
        let msg = `📅 <b>Tugas Hari Ini (${tasks.length}):</b>\n\n`;
        tasks.forEach((t: any, i: number) => {
          const courseName = t.courses?.name || "Tanpa Mata Kuliah";
          const time = t.deadline ? new Date(t.deadline).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" }) : "-";
          msg += `${i + 1}. 📝 <b>${t.title}</b> (${courseName})\n🕒 Jam: ${time}\n🎯 Prioritas: ${t.priority}\n\n`;
        });
        await sendTelegramMessage(chatId, msg);
      }
      return Response.json({ ok: true });
    }

    if (cmd === "/upcoming") {
      const next7Days = new Date(now.getTime() + 7 * 86400000).toISOString();

      const { data: tasks } = await supabase
        .from("assignments")
        .select("*, courses(name)")
        .eq("user_id", connection.user_id)
        .neq("status", "completed")
        .gte("deadline", now.toISOString())
        .lte("deadline", next7Days)
        .order("deadline");

      if (!tasks || tasks.length === 0) {
        await sendTelegramMessage(chatId, "🎉 <b>Tidak ada deadline tugas dalam 7 hari ke depan!</b>");
      } else {
        let msg = `⏰ <b>Deadline Terdekat 7 Hari (${tasks.length}):</b>\n\n`;
        tasks.forEach((t: any, i: number) => {
          const courseName = t.courses?.name || "Tanpa Mata Kuliah";
          const dateStr = t.deadline ? new Date(t.deadline).toLocaleDateString("id-ID", { day: "numeric", month: "short", timeZone: "Asia/Jakarta" }) : "-";
          msg += `${i + 1}. 📝 <b>${t.title}</b> (${courseName})\n📅 Tgl: ${dateStr}\n🎯 Prioritas: ${t.priority}\n\n`;
        });
        await sendTelegramMessage(chatId, msg);
      }
      return Response.json({ ok: true });
    }

    if (cmd === "/tasks") {
      const { data: tasks } = await supabase
        .from("assignments")
        .select("*, courses(name)")
        .eq("user_id", connection.user_id)
        .neq("status", "completed")
        .order("deadline", { ascending: true, nullsFirst: false });

      if (!tasks || tasks.length === 0) {
        await sendTelegramMessage(chatId, "🎉 <b>Semua tugas telah selesai dikerjakan!</b>");
      } else {
        let msg = `📋 <b>Daftar Tugas Aktif (${tasks.length}):</b>\n\n`;
        tasks.forEach((t: any, i: number) => {
          const courseName = t.courses?.name || "Tanpa MK";
          const dlText = t.deadline ? new Date(t.deadline).toLocaleDateString("id-ID", { day: "numeric", month: "short", timeZone: "Asia/Jakarta" }) : "Tidak ada";
          msg += `${i + 1}. 📝 <b>${t.title}</b>\n📚 MK: ${courseName} | 📅 DL: ${dlText} | Status: <code>${t.status}</code>\n\n`;
        });
        await sendTelegramMessage(chatId, msg);
      }
      return Response.json({ ok: true });
    }

    if (cmd === "/courses") {
      const { data: courses } = await supabase
        .from("courses")
        .select("name")
        .eq("user_id", connection.user_id)
        .order("name");

      if (!courses || courses.length === 0) {
        await sendTelegramMessage(chatId, "📚 <b>Belum ada mata kuliah yang didaftarkan.</b>");
      } else {
        let msg = `📚 <b>Daftar Mata Kuliah (${courses.length}):</b>\n\n`;
        courses.forEach((c: any, i: number) => {
          msg += `${i + 1}. 📖 ${c.name}\n`;
        });
        await sendTelegramMessage(chatId, msg);
      }
      return Response.json({ ok: true });
    }

    if (cmd === "/stats") {
      const { data: tasks } = await supabase
        .from("assignments")
        .select("status, deadline")
        .eq("user_id", connection.user_id);

      const stats = { total: 0, pending: 0, in_progress: 0, completed: 0, overdue: 0 };
      if (tasks) {
        stats.total = tasks.length;
        tasks.forEach((t: any) => {
          if (t.status === "completed") {
            stats.completed++;
          } else if (t.deadline && new Date(t.deadline) < now) {
            stats.overdue++;
          } else if (t.status === "in_progress") {
            stats.in_progress++;
          } else {
            stats.pending++;
          }
        });
      }

      const msg = `📊 <b>Statistik Tugas Kuliahmu:</b>\n\n` +
        `📝 Total Tugas: <b>${stats.total}</b>\n` +
        `⏳ Ongoing: <b>${stats.pending}</b>\n` +
        `🔄 In Progress: <b>${stats.in_progress}</b>\n` +
        `✅ Selesai: <b>${stats.completed}</b>\n` +
        `⚠️ Terlambat: <b>${stats.overdue}</b>\n\n` +
        `Buka dashboard lengkap di <a href="${appUrl}/dashboard">TaskChat AI Dashboard</a>`;

      await sendTelegramMessage(chatId, msg);
      return Response.json({ ok: true });
    }

    // Default response for unhandled commands
    await sendTelegramMessage(chatId, "❌ Command tidak dikenal. Gunakan /help untuk melihat daftar perintah.");
    return Response.json({ ok: true });
  }

  // Extract task from message using AI
  await sendTelegramMessage(chatId, "🤖 Sedang menganalisis pesanmu...");

  const extracted = await extractTaskFromMessage(text);

  if (!extracted) {
    await sendTelegramMessage(
      chatId,
      "❌ Maaf, saya sedang tidak bisa memproses pesanmu karena ada masalah sistem. Coba beberapa saat lagi."
    );
    return Response.json({ ok: true });
  }

  if (extracted.action === "invalid") {
    const feedback = extracted.feedback_message || 
      "❌ Maaf, saya tidak memahami pesanmu. Coba tulis pesan dengan lebih jelas.\n\n" +
      "Contoh:\n" +
      "• <i>\"Tugas Pemrograman Web deadline besok\"</i>\n" +
      "• <i>\"Ubah status tugas web ke selesai\"</i>\n" +
      "• <i>\"Hapus tugas kalkulus\"</i>";
    await sendTelegramMessage(chatId, feedback);
    return Response.json({ ok: true });
  }

  if (extracted.action === "create") {
    const taskData = extracted.task_data;
    if (!taskData || !taskData.title) {
      await sendTelegramMessage(
        chatId,
        "❌ Nama/judul tugas wajib disertakan untuk menambahkan tugas baru. Contoh:\n<i>\"Tugas Fisika membuat resume\"</i>"
      );
      return Response.json({ ok: true });
    }

    // Find or create course
    let courseId: string | null = null;
    if (taskData.course) {
      const { data: existingCourse } = await supabase
        .from("courses")
        .select("id")
        .eq("user_id", connection.user_id)
        .ilike("name", taskData.course)
        .single();

      if (existingCourse) {
        courseId = existingCourse.id;
      } else {
        const colors = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#3b82f6", "#a855f7"];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const { data: newCourse } = await supabase
          .from("courses")
          .insert([{ user_id: connection.user_id, name: taskData.course, color }])
          .select("id")
          .single();
        courseId = newCourse?.id || null;
      }
    }

    // Save assignment
    const { data: assignment, error } = await supabase
      .from("assignments")
      .insert([{
        user_id: connection.user_id,
        course_id: courseId,
        title: taskData.title,
        description: taskData.description || null,
        deadline: formatDeadlineForDb(taskData.deadline),
        priority: taskData.priority || "medium",
        status: taskData.status || "pending",
        type: taskData.type || "tugas",
        source_text: text,
      }])
      .select()
      .single();

    if (error) {
      await sendTelegramMessage(chatId, "❌ Gagal menyimpan tugas. Coba lagi.");
      return Response.json({ ok: true });
    }

    const deadlineText = assignment.deadline
      ? `📅 Deadline: ${new Date(assignment.deadline).toLocaleDateString("id-ID", {
          weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Jakarta"
        })}`
      : "📅 Deadline: Tidak ditentukan";

    await sendTelegramMessage(
      chatId,
      `✅ <b>Tugas berhasil disimpan!</b>\n\n` +
      `📝 <b>${assignment.title}</b>\n` +
      `📚 Mata Kuliah: ${taskData.course || "Tidak ditentukan"}\n` +
      `${deadlineText}\n` +
      `🎯 Prioritas: ${assignment.priority}\n\n` +
      `Lihat di dashboard: <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">${process.env.NEXT_PUBLIC_APP_URL}/dashboard</a>`
    );

    return Response.json({ ok: true });
  }

  if (extracted.action === "update") {
    const searchQuery = extracted.search_query?.trim();
    if (!searchQuery) {
      await sendTelegramMessage(
        chatId,
        "❌ Nama tugas yang ingin diubah tidak jelas. Silakan kirim ulang perintah dengan nama tugas yang spesifik."
      );
      return Response.json({ ok: true });
    }

    // Fetch assignments to match
    const { data: tasks, error: fetchError } = await supabase
      .from("assignments")
      .select("*, courses(name)")
      .eq("user_id", connection.user_id);

    if (fetchError || !tasks) {
      await sendTelegramMessage(chatId, "❌ Gagal mencari tugas untuk diupdate. Coba lagi nanti.");
      return Response.json({ ok: true });
    }

    const searchQueryLower = searchQuery.toLowerCase();
    const matchedTasks = tasks.filter((t: any) => 
      t.title.toLowerCase().includes(searchQueryLower) || 
      (t.courses?.name && t.courses.name.toLowerCase().includes(searchQueryLower))
    );

    let targetTask = null;
    if (matchedTasks.length === 0) {
      await sendTelegramMessage(
        chatId,
        `❌ Tugas dengan kata kunci "<b>${searchQuery}</b>" tidak ditemukan.\n\nKetik /tasks untuk melihat daftar tugas aktif Anda.`
      );
      return Response.json({ ok: true });
    } else if (matchedTasks.length === 1) {
      targetTask = matchedTasks[0];
    } else {
      // Multiple matches
      const activeMatched = matchedTasks.filter((t: any) => t.status !== "completed");
      if (activeMatched.length === 1) {
        targetTask = activeMatched[0];
      } else {
        let msg = `🔍 <b>Ditemukan beberapa tugas yang cocok dengan "${searchQuery}":</b>\n\n`;
        const listToDisplay = activeMatched.length > 0 ? activeMatched : matchedTasks;
        listToDisplay.slice(0, 5).forEach((t: any, i: number) => {
          const courseName = t.courses?.name || "Tanpa Mata Kuliah";
          const statusText = t.status === "completed" ? "✅ Selesai" : t.status === "in_progress" ? "🔄 Sedang Dikerjakan" : "⏳ Pending";
          msg += `${i + 1}. 📝 <b>${t.title}</b> (${courseName}) - <i>${statusText}</i>\n`;
        });
        msg += `\nSilakan kirim ulang perintah dengan nama tugas yang lebih spesifik.`;
        await sendTelegramMessage(chatId, msg);
        return Response.json({ ok: true });
      }
    }

    const taskData = extracted.task_data || {};
    const updates: any = {};
    if (taskData.title !== undefined) updates.title = taskData.title;
    if (taskData.description !== undefined) updates.description = taskData.description;
    if (taskData.deadline !== undefined) updates.deadline = formatDeadlineForDb(taskData.deadline);
    if (taskData.priority !== undefined) updates.priority = taskData.priority;
    if (taskData.status !== undefined) updates.status = taskData.status;
    if (taskData.type !== undefined) updates.type = taskData.type;

    if (taskData.course !== undefined) {
      if (taskData.course === null) {
        updates.course_id = null;
      } else {
        // Find or create course
        let courseId: string | null = null;
        const { data: existingCourse } = await supabase
          .from("courses")
          .select("id")
          .eq("user_id", connection.user_id)
          .ilike("name", taskData.course)
          .single();

        if (existingCourse) {
          courseId = existingCourse.id;
        } else {
          const colors = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#3b82f6", "#a855f7"];
          const color = colors[Math.floor(Math.random() * colors.length)];
          const { data: newCourse } = await supabase
            .from("courses")
            .insert([{ user_id: connection.user_id, name: taskData.course, color }])
            .select("id")
            .single();
          courseId = newCourse?.id || null;
        }
        updates.course_id = courseId;
      }
    }

    if (Object.keys(updates).length === 0) {
      await sendTelegramMessage(
        chatId,
        `🔍 Tugas <b>"${targetTask.title}"</b> ditemukan, tetapi saya tidak mendeteksi informasi baru untuk diperbarui.\n\nContoh:\n• <i>\"Ubah deadline tugas ${targetTask.title} jadi besok\"</i>\n• <i>\"Ubah status tugas ${targetTask.title} menjadi selesai\"</i>`
      );
      return Response.json({ ok: true });
    }

    const { data: updatedAssignment, error: updateError } = await supabase
      .from("assignments")
      .update(updates)
      .eq("id", targetTask.id)
      .select("*, courses(name)")
      .single();

    if (updateError) {
      await sendTelegramMessage(chatId, "❌ Gagal mengupdate tugas. Silakan coba lagi.");
      return Response.json({ ok: true });
    }

    let successMsg = `✅ <b>Tugas berhasil diperbarui!</b>\n\n`;
    successMsg += `📝 <b>${updatedAssignment.title}</b>\n`;

    if (updates.title) successMsg += `• Judul diubah dari "<i>${targetTask.title}</i>" menjadi "<i>${updatedAssignment.title}</i>"\n`;
    if (updates.course_id !== undefined) {
      const oldCourse = targetTask.courses?.name || "Tidak ditentukan";
      const newCourse = updatedAssignment.courses?.name || "Tidak ditentukan";
      successMsg += `• Mata Kuliah diubah dari "<i>${oldCourse}</i>" menjadi "<i>${newCourse}</i>"\n`;
    }
    if (updates.deadline !== undefined) {
      const oldDL = targetTask.deadline 
        ? new Date(targetTask.deadline).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" })
        : "Tidak ditentukan";
      const newDL = updatedAssignment.deadline
        ? new Date(updatedAssignment.deadline).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" })
        : "Tidak ditentukan";
      successMsg += `• Deadline diubah dari <i>${oldDL}</i> menjadi <i>${newDL}</i>\n`;
    }
    if (updates.priority) {
      successMsg += `• Prioritas diubah dari <code>${targetTask.priority}</code> menjadi <code>${updatedAssignment.priority}</code>\n`;
    }
    if (updates.status) {
      const statusLabels: Record<string, string> = { pending: "Pending", in_progress: "In Progress", completed: "Selesai" };
      successMsg += `• Status diubah dari <code>${statusLabels[targetTask.status]}</code> menjadi <code>${statusLabels[updatedAssignment.status]}</code>\n`;
    }
    if (updates.type) {
      successMsg += `• Tipe diubah dari <code>${targetTask.type}</code> menjadi <code>${updatedAssignment.type}</code>\n`;
    }
    if (updates.description !== undefined) {
      successMsg += `• Deskripsi diperbarui\n`;
    }

    successMsg += `\nLihat di dashboard: <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">${process.env.NEXT_PUBLIC_APP_URL}/dashboard</a>`;
    await sendTelegramMessage(chatId, successMsg);
    return Response.json({ ok: true });
  }

  if (extracted.action === "delete") {
    const searchQuery = extracted.search_query?.trim();
    if (!searchQuery) {
      await sendTelegramMessage(
        chatId,
        "❌ Nama tugas yang ingin dihapus tidak jelas. Silakan kirim ulang perintah dengan nama tugas yang spesifik."
      );
      return Response.json({ ok: true });
    }

    const { data: tasks, error: fetchError } = await supabase
      .from("assignments")
      .select("*, courses(name)")
      .eq("user_id", connection.user_id);

    if (fetchError || !tasks) {
      await sendTelegramMessage(chatId, "❌ Gagal mencari tugas untuk dihapus. Coba lagi nanti.");
      return Response.json({ ok: true });
    }

    const searchQueryLower = searchQuery.toLowerCase();
    const matchedTasks = tasks.filter((t: any) => 
      t.title.toLowerCase().includes(searchQueryLower) || 
      (t.courses?.name && t.courses.name.toLowerCase().includes(searchQueryLower))
    );

    let targetTask = null;
    if (matchedTasks.length === 0) {
      await sendTelegramMessage(
        chatId,
        `❌ Tugas dengan kata kunci "<b>${searchQuery}</b>" tidak ditemukan.\n\nKetik /tasks untuk melihat daftar tugas aktif Anda.`
      );
      return Response.json({ ok: true });
    } else if (matchedTasks.length === 1) {
      targetTask = matchedTasks[0];
    } else {
      // Multiple matches
      const activeMatched = matchedTasks.filter((t: any) => t.status !== "completed");
      if (activeMatched.length === 1) {
        targetTask = activeMatched[0];
      } else {
        let msg = `🔍 <b>Ditemukan beberapa tugas yang cocok dengan "${searchQuery}":</b>\n\n`;
        const listToDisplay = activeMatched.length > 0 ? activeMatched : matchedTasks;
        listToDisplay.slice(0, 5).forEach((t: any, i: number) => {
          const courseName = t.courses?.name || "Tanpa Mata Kuliah";
          const statusText = t.status === "completed" ? "✅ Selesai" : t.status === "in_progress" ? "🔄 Sedang Dikerjakan" : "⏳ Pending";
          msg += `${i + 1}. 📝 <b>${t.title}</b> (${courseName}) - <i>${statusText}</i>\n`;
        });
        msg += `\nSilakan kirim ulang perintah hapus dengan nama tugas yang lebih spesifik.`;
        await sendTelegramMessage(chatId, msg);
        return Response.json({ ok: true });
      }
    }

    const { error: deleteError } = await supabase
      .from("assignments")
      .delete()
      .eq("id", targetTask.id)
      .eq("user_id", connection.user_id);

    if (deleteError) {
      await sendTelegramMessage(chatId, "❌ Gagal menghapus tugas. Silakan coba lagi.");
      return Response.json({ ok: true });
    }

    await sendTelegramMessage(
      chatId,
      `🗑️ <b>Tugas berhasil dihapus!</b>\n\n📝 <b>${targetTask.title}</b> (${targetTask.courses?.name || "Tanpa Mata Kuliah"})\n\nTugas tersebut telah dihapus secara permanen dari database.`
    );
    return Response.json({ ok: true });
  }
}
