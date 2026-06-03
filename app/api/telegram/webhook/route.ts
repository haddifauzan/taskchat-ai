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

  // Skip commands
  if (text.startsWith("/start")) {
    await sendTelegramMessage(
      chatId,
      `👋 Halo! Saya <b>TaskChat AI Bot</b>.\n\nKirimkan pesan tentang tugasmu dan saya akan otomatis menyimpannya!\n\n<b>Contoh:</b>\n"Tugas AI bikin chatbot deadline minggu depan"\n"Quiz Basis Data besok jam 10 pagi"\n\nLogin di <a href="${process.env.NEXT_PUBLIC_APP_URL}">TaskChat AI</a> untuk melihat dashboardmu.`
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
      `❌ Akunmu belum terhubung ke TaskChat AI.\n\nLogin dan hubungkan Telegram di: <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings">${process.env.NEXT_PUBLIC_APP_URL}/settings</a>`
    );
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
