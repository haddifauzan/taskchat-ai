import { createClient } from "@/utils/supabase/server";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { telegram_id, telegram_username } = body;

  if (!telegram_id || isNaN(parseInt(telegram_id))) {
    return Response.json({ error: "Telegram ID tidak valid" }, { status: 400 });
  }

  const { error } = await supabase
    .from("telegram_connections")
    .upsert(
      {
        user_id: user.id,
        telegram_id: parseInt(telegram_id),
        telegram_username: telegram_username || null,
        connected_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true });
}
