import { createClient } from "@/utils/supabase/server";
import { NextRequest } from "next/server";

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/tasks/[id]">
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await request.json();

  const { data, error } = await supabase
    .from("assignments")
    .update(body)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*, courses(id, name, color)")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function DELETE(
  _request: NextRequest,
  ctx: RouteContext<"/api/tasks/[id]">
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  const { error } = await supabase
    .from("assignments")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return new Response(null, { status: 204 });
}
