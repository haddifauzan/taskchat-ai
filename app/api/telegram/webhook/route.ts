import { createClient } from "@/utils/supabase/server";
import { NextRequest } from "next/server";

// AI extraction prompt (shared across providers)
const EXTRACTION_PROMPT = `Kamu adalah asisten AI yang mengekstrak informasi tugas dari pesan mahasiswa Indonesia.

Ekstrak informasi berikut dari pesan:
- title: judul singkat tugas (wajib)
- course: nama mata kuliah yang disebutkan (atau null jika tidak ada)
- deadline: tanggal deadline dalam format ISO 8601 (atau null jika tidak disebutkan)
- description: deskripsi singkat tugas
- type: kategori tugas ("tugas", "quiz", "tubes", "presentasi", "praktikum") - pilih yang paling sesuai
- priority: prioritas ("high" jika deadline < 3 hari, "medium" jika < 7 hari, "low" jika > 7 hari atau tidak ada deadline)

Jawab HANYA dengan JSON valid, tanpa markdown atau penjelasan tambahan.`;

async function extractTaskFromMessage(message: string): Promise<{
  title: string;
  course?: string;
  deadline?: string;
  description?: string;
  type: string;
  priority: string;
} | null> {
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  const today = new Date().toISOString().split("T")[0];

  const userPrompt = `Hari ini: ${today}\n\nPesan mahasiswa:\n"${message}"\n\nEkstrak informasi tugas dari pesan di atas.`;

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
          max_tokens: 300,
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
              maxOutputTokens: 300,
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
      `Bot ini membantu kamu mencatat tugas kuliah langsung via Telegram. Cukup kirim chat biasa seperti:\n` +
      `<i>"Tugas Pemrograman Web membuat website portfolio deadline Jumat depan"</i>\n\n` +
      `<b>Daftar Perintah:</b>\n` +
      `/today - Tugas hari ini\n` +
      `/upcoming - Deadline terdekat (7 hari)\n` +
      `/tasks - Semua tugas belum selesai\n` +
      `/courses - Daftar mata kuliah\n` +
      `/stats - Statistik tugas\n` +
      `/help - Bantuan penggunaan\n\n` +
      `Login di <a href="${appUrl}">TaskChat AI</a> untuk melihat dashboard.`
    );
    return Response.json({ ok: true });
  }

  const supabase = await createClient();

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
          const time = t.deadline ? new Date(t.deadline).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "-";
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
          const dateStr = t.deadline ? new Date(t.deadline).toLocaleDateString("id-ID", { day: "numeric", month: "short" }) : "-";
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
          const dlText = t.deadline ? new Date(t.deadline).toLocaleDateString("id-ID", { day: "numeric", month: "short" }) : "Tidak ada";
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

  if (!extracted || !extracted.title) {
    await sendTelegramMessage(
      chatId,
      "❌ Maaf, saya tidak bisa memahami pesanmu. Coba tulis pesan dengan lebih jelas, contoh:\n\"Tugas Pemrograman Web bikin website portfolio deadline Jumat\""
    );
    return Response.json({ ok: true });
  }

  // Find or create course
  let courseId: string | null = null;
  if (extracted.course) {
    const { data: existingCourse } = await supabase
      .from("courses")
      .select("id")
      .eq("user_id", connection.user_id)
      .ilike("name", extracted.course)
      .single();

    if (existingCourse) {
      courseId = existingCourse.id;
    } else {
      const colors = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#3b82f6", "#a855f7"];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const { data: newCourse } = await supabase
        .from("courses")
        .insert([{ user_id: connection.user_id, name: extracted.course, color }])
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
      title: extracted.title,
      description: extracted.description || null,
      deadline: extracted.deadline || null,
      priority: (extracted.priority as any) || "medium",
      status: "pending",
      type: (extracted.type as any) || "tugas",
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
        weekday: "long", year: "numeric", month: "long", day: "numeric",
      })}`
    : "📅 Deadline: Tidak ditentukan";

  await sendTelegramMessage(
    chatId,
    `✅ <b>Tugas berhasil disimpan!</b>\n\n📝 <b>${assignment.title}</b>\n📚 Mata Kuliah: ${extracted.course || "Tidak ditentukan"}\n${deadlineText}\n🎯 Prioritas: ${assignment.priority}\n\nLihat di dashboard: <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">${process.env.NEXT_PUBLIC_APP_URL}/dashboard</a>`
  );

  return Response.json({ ok: true });
}
