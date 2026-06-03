import { createClient } from "@/utils/supabase/server";
import TasksClient from "@/components/tasks/TasksClient";

export default async function TasksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: assignments = [] }, { data: courses = [] }] = await Promise.all([
    supabase
      .from("assignments")
      .select("*, courses(id, name, color)")
      .eq("user_id", user!.id)
      .order("deadline", { ascending: true, nullsFirst: false }),
    supabase
      .from("courses")
      .select("*")
      .eq("user_id", user!.id)
      .order("name"),
  ]);

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <header className="px-8 py-6 flex items-center justify-between border-b border-[#f0eef8] bg-white sticky top-0 z-10">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a2e]">Tasks</h1>
          <p className="text-sm text-[#9ca3af] mt-0.5">Kelola semua tugasmu di sini</p>
        </div>
      </header>
      <main className="flex-1 px-8 py-6">
        <TasksClient assignments={assignments as any} courses={courses as any} />
      </main>
    </div>
  );
}
