import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";

// Admin client to bypass RLS for cron/system operations
function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
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

export async function GET(request: NextRequest) {
  return handleCron(request);
}

export async function POST(request: NextRequest) {
  return handleCron(request);
}

async function handleCron(request: NextRequest) {
  // Simple Authorization protection using secret header or token
  const authHeader = request.headers.get("authorization");
  const { searchParams } = new URL(request.url);
  const secretParam = searchParams.get("secret");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret) {
    const isAuthorized =
      authHeader === `Bearer ${cronSecret}` || secretParam === cronSecret;
    if (!isAuthorized) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const supabase = createAdminClient();
  const now = new Date();
  const nowTime = now.getTime();

  // 1. Fetch all active (non-completed) assignments with deadlines
  const { data: assignments, error: assignmentsError } = await supabase
    .from("assignments")
    .select("*, courses(name, color)")
    .neq("status", "completed")
    .not("deadline", "is", null);

  if (assignmentsError) {
    return Response.json({ error: assignmentsError.message }, { status: 500 });
  }

  if (!assignments || assignments.length === 0) {
    return Response.json({ message: "No active assignments to process." });
  }

  // 2. Fetch telegram connections for unique users
  const userIds = Array.from(new Set(assignments.map((a: any) => a.user_id)));
  const { data: connections, error: connectionsError } = await supabase
    .from("telegram_connections")
    .select("user_id, telegram_id")
    .in("user_id", userIds);

  if (connectionsError) {
    return Response.json({ error: connectionsError.message }, { status: 500 });
  }

  const userIdToTelegramId = new Map<string, number>(
    (connections || []).map((c: any) => [c.user_id, c.telegram_id])
  );

  // 3. Fetch already sent reminders
  const assignmentIds = assignments.map((a: any) => a.id);
  const { data: sentReminders, error: remindersError } = await supabase
    .from("reminders")
    .select("assignment_id, reminder_type")
    .in("assignment_id", assignmentIds)
    .not("sent_at", "is", null);

  if (remindersError) {
    return Response.json({ error: remindersError.message }, { status: 500 });
  }

  const sentSet = new Set<string>(
    (sentReminders || []).map((r: any) => `${r.assignment_id}_${r.reminder_type}`)
  );

  const sentLog: Array<{ assignment_id: string; title: string; tier: string; telegram_id: number }> = [];

  // 4. Process each assignment
  for (const assignment of assignments) {
    const telegramId = userIdToTelegramId.get(assignment.user_id);
    if (!telegramId) continue; // No connected Telegram account

    const deadlineTime = new Date(assignment.deadline).getTime();
    const diffMs = deadlineTime - nowTime;
    const diffHours = diffMs / (1000 * 60 * 60);

    // Determine target reminder tier
    let targetTier: "h-7" | "h-3" | "h-1" | "h-0" | null = null;

    if (diffHours >= -1 && diffHours <= 2) {
      targetTier = "h-0"; // Within 2 hours before, up to 1 hour after deadline
    } else if (diffHours > 2 && diffHours <= 24) {
      targetTier = "h-1"; // Within 24 hours (1 day)
    } else if (diffHours > 24 && diffHours <= 72) {
      targetTier = "h-3"; // Within 72 hours (3 days)
    } else if (diffHours > 72 && diffHours <= 168) {
      targetTier = "h-7"; // Within 168 hours (7 days)
    }

    if (!targetTier) continue;

    const key = `${assignment.id}_${targetTier}`;
    if (sentSet.has(key)) continue; // Reminder already sent

    // Format deadline text for message
    const dlDate = new Date(assignment.deadline);
    const deadlineText = dlDate.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "Asia/Jakarta",
    });
    const deadlineTimeText = dlDate.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    });

    const courseName = assignment.courses?.name || "Tanpa Mata Kuliah";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Formulate message templates
    const messages = {
      "h-7": `📅 <b>[Reminder H-7] Deadline Tugas 1 Minggu Lagi!</b>\n\n` +
             `📝 <b>Tugas:</b> ${assignment.title}\n` +
             `📚 <b>Mata Kuliah:</b> ${courseName}\n` +
             `⏳ <b>Deadline:</b> ${deadlineText} pukul ${deadlineTimeText} WIB\n` +
             `🎯 <b>Prioritas:</b> ${assignment.priority.toUpperCase()}\n` +
             (assignment.description ? `📖 <b>Deskripsi:</b> <i>${assignment.description}</i>\n` : "") +
             `\nYuk, mulai cicil pengerjaannya! Info selengkapnya dapat dilihat di <a href="${appUrl}/dashboard">Dashboard TaskChat AI</a>.`,
             
      "h-3": `⚠️ <b>[Reminder H-3] Tugas Harus Segera Dikerjakan!</b>\n\n` +
             `📝 <b>Tugas:</b> ${assignment.title}\n` +
             `📚 <b>Mata Kuliah:</b> ${courseName}\n` +
             `⏳ <b>Deadline:</b> ${deadlineText} pukul ${deadlineTimeText} WIB (3 hari lagi)\n` +
             `🎯 <b>Prioritas:</b> ${assignment.priority.toUpperCase()}\n` +
             (assignment.description ? `📖 <b>Deskripsi:</b> <i>${assignment.description}</i>\n` : "") +
             `\nJangan tunda pengerjaan tugas ini ya. Semangat! Selengkapnya di <a href="${appUrl}/dashboard">Dashboard</a>.`,
             
      "h-1": `🚨 <b>[Reminder H-1] Deadline Tinggal Besok!</b>\n\n` +
             `📝 <b>Tugas:</b> ${assignment.title}\n` +
             `📚 <b>Mata Kuliah:</b> ${courseName}\n` +
             `⏳ <b>Deadline:</b> ${deadlineText} pukul ${deadlineTimeText} WIB (Besok!)\n` +
             `🎯 <b>Prioritas:</b> ${assignment.priority.toUpperCase()}\n` +
             (assignment.description ? `📖 <b>Deskripsi:</b> <i>${assignment.description}</i>\n` : "") +
             `\nSelesaikan tugasmu segera sebelum terlambat! Perbarui status pengerjaan di <a href="${appUrl}/dashboard">Dashboard</a> atau balas bot dengan <i>"Tugas ${assignment.title} sudah selesai"</i>.`,
             
      "h-0": `🔥 <b>[Reminder Hari H] Deadline Tugas Hari Ini!</b>\n\n` +
             `📝 <b>Tugas:</b> ${assignment.title}\n` +
             `📚 <b>Mata Kuliah:</b> ${courseName}\n` +
             `⏳ <b>Deadline:</b> Hari ini pukul ${deadlineTimeText} WIB!\n` +
             `🎯 <b>Prioritas:</b> ${assignment.priority.toUpperCase()}\n` +
             (assignment.description ? `📖 <b>Deskripsi:</b> <i>${assignment.description}</i>\n` : "") +
             `\n⚠️ Waktu hampir habis! Segera selesaikan tugas ini dan unggah. Setelah selesai, tandai di <a href="${appUrl}/dashboard">Dashboard</a>.`
    };

    const text = messages[targetTier];

    try {
      // Send Telegram notification
      await sendTelegramMessage(telegramId, text);

      // Record in Supabase reminders table to mark as sent
      const { error: insertError } = await supabase
        .from("reminders")
        .insert([{
          assignment_id: assignment.id,
          reminder_type: targetTier,
          sent_at: new Date().toISOString(),
        }]);

      if (!insertError) {
        sentLog.push({
          assignment_id: assignment.id,
          title: assignment.title,
          tier: targetTier,
          telegram_id: telegramId,
        });
      }
    } catch (e) {
      console.error(`Failed to process reminder for assignment ${assignment.id}:`, e);
    }
  }

  return Response.json({
    message: `Processed reminders. Sent ${sentLog.length} notification(s).`,
    sent: sentLog,
    timestamp: new Date().toISOString(),
  });
}
