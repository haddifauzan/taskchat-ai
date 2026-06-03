import { createClient } from "@/utils/supabase/server";
import { NextRequest } from "next/server";
import { formatDeadlineForDb } from "@/utils/date";

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
- "task_data": Wajib diisi untuk aksi "create" dan (jika ada perubahan) untuk "update". Isi field yang terdeteksi atau buat nilai yang relevan sesuai panduan berikut:
  * "title": Judul/nama tugas baru yang singkat dan padat (misal: "Membuat Resume Bab 2"). Jangan terlalu panjang.
  * "course": Nama mata kuliah yang disebutkan.
  * "description": Deskripsi singkat atau rincian tugas. Jika pengguna menyertakan rincian tambahan (seperti "tentang hukum newton", "tulis tangan di kertas A4"), masukkan ke sini. Jika tidak ada rincian tambahan, buatlah ringkasan/deskripsi singkat otomatis berdasarkan judul tugas dan mata kuliahnya (misal: "Tugas membuat resume bab 2 untuk mata kuliah Fisika") agar kolom deskripsi tidak kosong.
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

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const text = body?.text?.trim();
  if (!text) {
    return Response.json({ response: "Pesan tidak boleh kosong." });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (text === "/start" || text === "/help") {
    return Response.json({
      response: `👋 Halo! Saya **TaskChat AI Bot**.\n\n` +
      `Saya bisa membantu kamu mengelola tugas kuliah langsung via Web Chat ini menggunakan percakapan biasa.\n\n` +
      `💡 **Contoh Penggunaan AI:**\n` +
      `• **Tambah Tugas:** *"Tugas Fisika membuat resume bab 2 deadline senin depan"*\n` +
      `• **Ubah Detail Tugas:** *"Ubah deadline tugas membuat resume Fisika jadi besok"*\n` +
      `• **Ubah Status Tugas:** *"Tandai tugas resume Fisika sedang dikerjakan"* atau *"Tugas resume Fisika sudah selesai"*\n` +
      `• **Hapus Tugas:** *"Hapus tugas resume Fisika"*\n\n` +
      `📋 **Daftar Perintah Bot:**\n` +
      `/today - Tugas hari ini\n` +
      `/upcoming - Deadline terdekat (7 hari)\n` +
      `/tasks - Semua tugas aktif (belum selesai)\n` +
      `/courses - Daftar mata kuliah\n` +
      `/stats - Statistik tugas kuliahmu\n` +
      `/help - Tampilkan bantuan ini`
    });
  }

  if (text.startsWith("/")) {
    const cmd = text.toLowerCase().split(" ")[0];
    const now = new Date();

    if (cmd === "/today") {
      const jakartaDateFormatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Jakarta",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      const todayJakarta = jakartaDateFormatter.format(now);

      const { data: tasks } = await supabase
        .from("assignments")
        .select("*, courses(name)")
        .eq("user_id", user.id)
        .neq("status", "completed")
        .order("deadline");

      const todayTasks = (tasks || []).filter((t: any) => t.deadline && jakartaDateFormatter.format(new Date(t.deadline)) === todayJakarta);

      if (todayTasks.length === 0) {
        return Response.json({ response: "🎉 **Tidak ada tugas untuk hari ini!**\nNikmati harimu." });
      } else {
        let msg = `📅 **Tugas Hari Ini (${todayTasks.length}):**\n\n`;
        todayTasks.forEach((t: any, i: number) => {
          const courseName = t.courses?.name || "Tanpa Mata Kuliah";
          const time = t.deadline ? new Date(t.deadline).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" }) : "-";
          msg += `${i + 1}. 📝 **${t.title}** (${courseName})\n🕒 Jam: ${time}\n🎯 Prioritas: ${t.priority}\n\n`;
        });
        return Response.json({ response: msg });
      }
    }

    if (cmd === "/upcoming") {
      const next7Days = new Date(now.getTime() + 7 * 86400000).toISOString();
      const { data: tasks } = await supabase
        .from("assignments")
        .select("*, courses(name)")
        .eq("user_id", user.id)
        .neq("status", "completed")
        .gte("deadline", now.toISOString())
        .lte("deadline", next7Days)
        .order("deadline");

      if (!tasks || tasks.length === 0) {
        return Response.json({ response: "🎉 **Tidak ada deadline tugas dalam 7 hari ke depan!**" });
      } else {
        let msg = `⏰ **Deadline Terdekat 7 Hari (${tasks.length}):**\n\n`;
        tasks.forEach((t: any, i: number) => {
          const courseName = t.courses?.name || "Tanpa Mata Kuliah";
          const dateStr = t.deadline ? new Date(t.deadline).toLocaleDateString("id-ID", { day: "numeric", month: "short", timeZone: "Asia/Jakarta" }) : "-";
          msg += `${i + 1}. 📝 **${t.title}** (${courseName})\n📅 Tgl: ${dateStr}\n🎯 Prioritas: ${t.priority}\n\n`;
        });
        return Response.json({ response: msg });
      }
    }

    if (cmd === "/tasks") {
      const { data: tasks } = await supabase
        .from("assignments")
        .select("*, courses(name)")
        .eq("user_id", user.id)
        .neq("status", "completed")
        .order("deadline", { ascending: true, nullsFirst: false });

      if (!tasks || tasks.length === 0) {
        return Response.json({ response: "🎉 **Semua tugas telah selesai dikerjakan!**" });
      } else {
        let msg = `📋 **Daftar Tugas Aktif (${tasks.length}):**\n\n`;
        tasks.forEach((t: any, i: number) => {
          const courseName = t.courses?.name || "Tanpa MK";
          const dlText = t.deadline ? new Date(t.deadline).toLocaleDateString("id-ID", { day: "numeric", month: "short", timeZone: "Asia/Jakarta" }) : "Tidak ada";
          msg += `${i + 1}. 📝 **${t.title}**\n📚 MK: ${courseName} | 📅 DL: ${dlText} | Status: \`${t.status}\`\n\n`;
        });
        return Response.json({ response: msg });
      }
    }

    if (cmd === "/courses") {
      const { data: courses } = await supabase
        .from("courses")
        .select("name")
        .eq("user_id", user.id)
        .order("name");

      if (!courses || courses.length === 0) {
        return Response.json({ response: "📚 **Belum ada mata kuliah yang didaftarkan.**" });
      } else {
        let msg = `📚 **Daftar Mata Kuliah (${courses.length}):**\n\n`;
        courses.forEach((c: any, i: number) => {
          msg += `${i + 1}. 📖 ${c.name}\n`;
        });
        return Response.json({ response: msg });
      }
    }

    if (cmd === "/stats") {
      const { data: tasks } = await supabase
        .from("assignments")
        .select("status, deadline")
        .eq("user_id", user.id);

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

      const msg = `📊 **Statistik Tugas Kuliahmu:**\n\n` +
        `📝 Total Tugas: **${stats.total}**\n` +
        `⏳ Ongoing: **${stats.pending}**\n` +
        `🔄 In Progress: **${stats.in_progress}**\n` +
        `✅ Selesai: **${stats.completed}**\n` +
        `⚠️ Terlambat: **${stats.overdue}**`;
      return Response.json({ response: msg });
    }

    return Response.json({ response: "❌ Command tidak dikenal. Gunakan /help untuk melihat daftar perintah." });
  }

  const extracted = await extractTaskFromMessage(text);

  if (!extracted) {
    return Response.json({ response: "❌ Maaf, saya sedang tidak bisa memproses pesanmu karena ada masalah sistem (Gagal memanggil AI model). Coba beberapa saat lagi." });
  }

  if (extracted.action === "invalid") {
    const feedback = extracted.feedback_message || 
      "❌ Maaf, saya tidak memahami pesanmu. Coba tulis pesan dengan lebih jelas.\n\n" +
      "Contoh:\n" +
      "• *\"Tugas Pemrograman Web deadline besok\"*\n" +
      "• *\"Ubah status tugas web ke selesai\"*\n" +
      "• *\"Hapus tugas kalkulus\"*";
    return Response.json({ response: feedback });
  }

  if (extracted.action === "create") {
    const taskData = extracted.task_data;
    if (!taskData || !taskData.title) {
      return Response.json({ response: "❌ Nama/judul tugas wajib disertakan untuk menambahkan tugas baru. Contoh:\n*\"Tugas Fisika membuat resume\"*" });
    }

    let courseId: string | null = null;
    if (taskData.course) {
      const { data: existingCourse } = await supabase
        .from("courses")
        .select("id")
        .eq("user_id", user.id)
        .ilike("name", taskData.course)
        .single();

      if (existingCourse) {
        courseId = existingCourse.id;
      } else {
        const colors = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#3b82f6", "#a855f7"];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const { data: newCourse } = await supabase
          .from("courses")
          .insert([{ user_id: user.id, name: taskData.course, color }])
          .select("id")
          .single();
        courseId = newCourse?.id || null;
      }
    }

    const { data: assignment, error } = await supabase
      .from("assignments")
      .insert([{
        user_id: user.id,
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
      return Response.json({ response: "❌ Gagal menyimpan tugas. Coba lagi." });
    }

    const deadlineText = assignment.deadline
      ? `📅 Deadline: ${new Date(assignment.deadline).toLocaleDateString("id-ID", {
          weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Jakarta"
        })}`
      : "📅 Deadline: Tidak ditentukan";

    return Response.json({
      response: `✅ **Tugas berhasil disimpan!**\n\n` +
      `📝 **${assignment.title}**\n` +
      `📚 Mata Kuliah: ${taskData.course || "Tidak ditentukan"}\n` +
      `${deadlineText}\n` +
      `🎯 Prioritas: ${assignment.priority}`
    });
  }

  if (extracted.action === "update") {
    const searchQuery = extracted.search_query?.trim();
    if (!searchQuery) {
      return Response.json({ response: "❌ Nama tugas yang ingin diubah tidak jelas. Silakan kirim ulang perintah dengan nama tugas yang spesifik." });
    }

    const { data: tasks, error: fetchError } = await supabase
      .from("assignments")
      .select("*, courses(name)")
      .eq("user_id", user.id);

    if (fetchError || !tasks) {
      return Response.json({ response: "❌ Gagal mencari tugas untuk diupdate. Coba lagi nanti." });
    }

    const searchQueryLower = searchQuery.toLowerCase();
    const matchedTasks = tasks.filter((t: any) => 
      t.title.toLowerCase().includes(searchQueryLower) || 
      (t.courses?.name && t.courses.name.toLowerCase().includes(searchQueryLower))
    );

    let targetTask = null;
    if (matchedTasks.length === 0) {
      return Response.json({ response: `❌ Tugas dengan kata kunci "**${searchQuery}**" tidak ditemukan.\n\nKetik /tasks untuk melihat daftar tugas aktif Anda.` });
    } else if (matchedTasks.length === 1) {
      targetTask = matchedTasks[0];
    } else {
      const activeMatched = matchedTasks.filter((t: any) => t.status !== "completed");
      if (activeMatched.length === 1) {
        targetTask = activeMatched[0];
      } else {
        let msg = `🔍 **Ditemukan beberapa tugas yang cocok dengan "${searchQuery}":**\n\n`;
        const listToDisplay = activeMatched.length > 0 ? activeMatched : matchedTasks;
        listToDisplay.slice(0, 5).forEach((t: any, i: number) => {
          const courseName = t.courses?.name || "Tanpa Mata Kuliah";
          const statusText = t.status === "completed" ? "✅ Selesai" : t.status === "in_progress" ? "🔄 Sedang Dikerjakan" : "⏳ Pending";
          msg += `${i + 1}. 📝 **${t.title}** (${courseName}) - *${statusText}*\n`;
        });
        msg += `\nSilakan kirim ulang perintah dengan nama tugas yang lebih spesifik.`;
        return Response.json({ response: msg });
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
        let courseId: string | null = null;
        const { data: existingCourse } = await supabase
          .from("courses")
          .select("id")
          .eq("user_id", user.id)
          .ilike("name", taskData.course)
          .single();

        if (existingCourse) {
          courseId = existingCourse.id;
        } else {
          const colors = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#3b82f6", "#a855f7"];
          const color = colors[Math.floor(Math.random() * colors.length)];
          const { data: newCourse } = await supabase
            .from("courses")
            .insert([{ user_id: user.id, name: taskData.course, color }])
            .select("id")
            .single();
          courseId = newCourse?.id || null;
        }
        updates.course_id = courseId;
      }
    }

    if (Object.keys(updates).length === 0) {
      return Response.json({ response: `🔍 Tugas **"${targetTask.title}"** ditemukan, tetapi saya tidak mendeteksi informasi baru untuk diperbarui.\n\nContoh:\n• *"Ubah deadline tugas ${targetTask.title} jadi besok"*\n• *"Ubah status tugas ${targetTask.title} menjadi selesai"*` });
    }

    const { data: updatedAssignment, error: updateError } = await supabase
      .from("assignments")
      .update(updates)
      .eq("id", targetTask.id)
      .select("*, courses(name)")
      .single();

    if (updateError) {
      return Response.json({ response: "❌ Gagal mengupdate tugas. Silakan coba lagi." });
    }

    let successMsg = `✅ **Tugas berhasil diperbarui!**\n\n`;
    successMsg += `📝 **${updatedAssignment.title}**\n`;

    if (updates.title) successMsg += `• Judul diubah dari *"${targetTask.title}"* menjadi *"${updatedAssignment.title}"*\n`;
    if (updates.course_id !== undefined) {
      const oldCourse = targetTask.courses?.name || "Tidak ditentukan";
      const newCourse = updatedAssignment.courses?.name || "Tidak ditentukan";
      successMsg += `• Mata Kuliah diubah dari *"${oldCourse}"* menjadi *"${newCourse}"*\n`;
    }
    if (updates.deadline !== undefined) {
      const oldDL = targetTask.deadline 
        ? new Date(targetTask.deadline).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" })
        : "Tidak ditentukan";
      const newDL = updatedAssignment.deadline
        ? new Date(updatedAssignment.deadline).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" })
        : "Tidak ditentukan";
      successMsg += `• Deadline diubah dari *${oldDL}* menjadi *${newDL}*\n`;
    }
    if (updates.priority) {
      successMsg += `• Prioritas diubah dari \`${targetTask.priority}\` menjadi \`${updatedAssignment.priority}\`\n`;
    }
    if (updates.status) {
      const statusLabels: Record<string, string> = { pending: "Pending", in_progress: "In Progress", completed: "Selesai" };
      successMsg += `• Status diubah dari \`${statusLabels[targetTask.status]}\` menjadi \`${statusLabels[updatedAssignment.status]}\`\n`;
    }
    if (updates.type) {
      successMsg += `• Tipe diubah dari \`${targetTask.type}\` menjadi \`${updatedAssignment.type}\`\n`;
    }
    if (updates.description !== undefined) {
      successMsg += `• Deskripsi diperbarui\n`;
    }

    return Response.json({ response: successMsg });
  }

  if (extracted.action === "delete") {
    const searchQuery = extracted.search_query?.trim();
    if (!searchQuery) {
      return Response.json({ response: "❌ Nama tugas yang ingin dihapus tidak jelas. Silakan kirim ulang perintah dengan nama tugas yang spesifik." });
    }

    const { data: tasks, error: fetchError } = await supabase
      .from("assignments")
      .select("*, courses(name)")
      .eq("user_id", user.id);

    if (fetchError || !tasks) {
      return Response.json({ response: "❌ Gagal mencari tugas untuk dihapus. Coba lagi nanti." });
    }

    const searchQueryLower = searchQuery.toLowerCase();
    const matchedTasks = tasks.filter((t: any) => 
      t.title.toLowerCase().includes(searchQueryLower) || 
      (t.courses?.name && t.courses.name.toLowerCase().includes(searchQueryLower))
    );

    let targetTask = null;
    if (matchedTasks.length === 0) {
      return Response.json({ response: `❌ Tugas dengan kata kunci "**${searchQuery}**" tidak ditemukan.\n\nKetik /tasks untuk melihat daftar tugas aktif Anda.` });
    } else if (matchedTasks.length === 1) {
      targetTask = matchedTasks[0];
    } else {
      const activeMatched = matchedTasks.filter((t: any) => t.status !== "completed");
      if (activeMatched.length === 1) {
        targetTask = activeMatched[0];
      } else {
        let msg = `🔍 **Ditemukan beberapa tugas yang cocok dengan "${searchQuery}":**\n\n`;
        const listToDisplay = activeMatched.length > 0 ? activeMatched : matchedTasks;
        listToDisplay.slice(0, 5).forEach((t: any, i: number) => {
          const courseName = t.courses?.name || "Tanpa Mata Kuliah";
          const statusText = t.status === "completed" ? "✅ Selesai" : t.status === "in_progress" ? "🔄 Sedang Dikerjakan" : "⏳ Pending";
          msg += `${i + 1}. 📝 **${t.title}** (${courseName}) - *${statusText}*\n`;
        });
        msg += `\nSilakan kirim ulang perintah hapus dengan nama tugas yang lebih spesifik.`;
        return Response.json({ response: msg });
      }
    }

    const { error: deleteError } = await supabase
      .from("assignments")
      .delete()
      .eq("id", targetTask.id)
      .eq("user_id", user.id);

    if (deleteError) {
      return Response.json({ response: "❌ Gagal menghapus tugas. Silakan coba lagi." });
    }

    return Response.json({ response: `🗑️ **Tugas berhasil dihapus!**\n\n📝 **${targetTask.title}** (${targetTask.courses?.name || "Tanpa Mata Kuliah"})\n\nTugas tersebut telah dihapus secara permanen dari database.` });
  }

  return Response.json({ response: "Permintaan berhasil, tapi tidak ada aksi yang diambil." });
}
