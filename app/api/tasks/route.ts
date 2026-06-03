import { createClient } from "@/utils/supabase/server";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const course_id = searchParams.get("course_id");
  const search = searchParams.get("search");

  let query = supabase
    .from("assignments")
    .select("*, courses(id, name, color)")
    .eq("user_id", user.id)
    .order("deadline", { ascending: true, nullsFirst: false });

  if (status) query = query.eq("status", status);
  if (course_id) query = query.eq("course_id", course_id);
  if (search) query = query.ilike("title", `%${search}%`);

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { data, error } = await supabase
    .from("assignments")
    .insert([{ ...body, user_id: user.id }])
    .select("*, courses(id, name, color)")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data, { status: 201 });
}
