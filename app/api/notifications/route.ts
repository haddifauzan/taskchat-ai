import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get recent reminders with their assignments
  const { data: reminders, error } = await supabase
    .from("reminders")
    .select(`
      id,
      reminder_type,
      sent_at,
      created_at,
      assignments:assignment_id (
        id,
        title,
        deadline,
        status,
        courses:course_id (
          id,
          name,
          color
        )
      )
    `)
    .order("sent_at", { ascending: false })
    .limit(10);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  // Filter out any reminders where the assignment was deleted/not found
  const formattedReminders = (reminders || [])
    .filter((r: any) => r.assignments)
    .map((r: any) => ({
      id: r.id,
      reminder_type: r.reminder_type,
      sent_at: r.sent_at,
      created_at: r.created_at,
      assignment: r.assignments,
    }));

  return Response.json(formattedReminders);
}
