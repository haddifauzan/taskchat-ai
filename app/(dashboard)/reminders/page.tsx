import { createClient } from "@/utils/supabase/server";
import NotificationMenu from "@/components/NotificationMenu";
import { redirect } from "next/navigation";

export default async function RemindersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const now = new Date();
  const next7 = new Date(now.getTime() + 7 * 86400000);

  // Get all non-completed tasks with deadlines
  const { data: tasks = [] } = await supabase
    .from("assignments")
    .select("*, courses(id, name, color)")
    .eq("user_id", user!.id)
    .neq("status", "completed")
    .not("deadline", "is", null)
    .order("deadline", { ascending: true });

  // Categorize
  const overdue = (tasks as any[]).filter((t) => new Date(t.deadline) < now);
  const today = (tasks as any[]).filter((t) => {
    const dl = new Date(t.deadline);
    return dl >= new Date(now.getFullYear(), now.getMonth(), now.getDate()) &&
      dl < new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  });
  const upcoming = (tasks as any[]).filter((t) => {
    const dl = new Date(t.deadline);
    return dl > now && dl <= next7;
  });

  const Section = ({
    title, items, accent, icon,
  }: {
    title: string;
    items: any[];
    accent: string;
    icon: React.ReactNode;
  }) => (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${accent}18`, color: accent }}>
          {icon}
        </div>
        <h2 className="text-base font-bold text-[#1a1a2e]">{title}</h2>
        <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${accent}18`, color: accent }}>
          {items.length}
        </span>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-[#9ca3af] text-center py-4">Tidak ada.</p>
      ) : (
        <div className="space-y-2">
          {items.map((task) => {
            const course = task.courses;
            const dl = new Date(task.deadline);
            const diffDays = Math.ceil((dl.getTime() - now.getTime()) / 86400000);
            return (
              <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#f8f7ff] transition-colors">
                <div
                  className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold"
                  style={{ background: `${course?.color || "#6366f1"}18`, color: course?.color || "#6366f1" }}
                >
                  {dl.getDate()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1a1a2e] truncate">{task.title}</p>
                  <p className="text-xs text-[#9ca3af]">{course?.name || "Tanpa Mata Kuliah"}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-semibold" style={{ color: accent }}>
                    {diffDays < 0
                      ? `${Math.abs(diffDays)} hari lalu`
                      : diffDays === 0
                      ? "Hari ini"
                      : `${diffDays} hari lagi`}
                  </p>
                  <p className="text-[10px] text-[#9ca3af]">
                    {dl.toLocaleDateString("id-ID", { day: "numeric", month: "short", timeZone: "Asia/Jakarta" })}{" "}
                    {dl.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <header className="px-8 py-6 flex items-center justify-between border-b border-[#f0eef8] bg-white sticky top-0 z-10">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a2e]">Reminders</h1>
          <p className="text-sm text-[#9ca3af] mt-0.5">Pantau deadline tugasmu</p>
        </div>
        <div className="flex items-center gap-3">
          <NotificationMenu />
        </div>
      </header>
      <main className="flex-1 px-8 py-6 space-y-4">
        <Section
          title="Terlambat (Overdue)"
          items={overdue}
          accent="#ef4444"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />
        <Section
          title="Hari Ini"
          items={today}
          accent="#f59e0b"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <Section
          title="7 Hari Ke Depan"
          items={upcoming}
          accent="#6366f1"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          }
        />
      </main>
    </div>
  );
}
