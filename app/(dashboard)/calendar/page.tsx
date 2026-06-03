import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function CalendarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  // Get all assignments for current month range
  const startOfMonth = new Date(year, month, 1).toISOString();
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

  const { data: assignments = [] } = await supabase
    .from("assignments")
    .select("*, courses(id, name, color)")
    .eq("user_id", user!.id)
    .gte("deadline", startOfMonth)
    .lte("deadline", endOfMonth)
    .neq("status", "completed")
    .order("deadline");

  const safeAssignments = assignments ?? [];

  // Group by day
  const tasksByDay: Record<number, typeof safeAssignments> = {};
  for (const a of safeAssignments) {
    if (a.deadline) {
      const day = new Date(a.deadline).getDate();
      if (!tasksByDay[day]) tasksByDay[day] = [];
      tasksByDay[day].push(a);
    }
  }

  // Calendar grid
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = now.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <header className="px-8 py-6 border-b border-[#f0eef8] bg-white sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-[#1a1a2e]">Calendar</h1>
        <p className="text-sm text-[#9ca3af] mt-0.5">Lihat semua deadline tugasmu</p>
      </header>

      <main className="flex-1 px-8 py-6 space-y-6">
        <div className="card p-6">
          {/* Month header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-[#1a1a2e] capitalize">{monthName}</h2>
            <div className="flex items-center gap-3 text-sm text-[#9ca3af]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#6366f1] inline-block" />
                Ada tugas
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444] inline-block" />
                Overdue
              </span>
            </div>
          </div>

          {/* Day names */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-[#9ca3af] py-2">{d}</div>
            ))}
          </div>

          {/* Cells */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (!day) return <div key={i} className="aspect-square" />;
              const isToday = day === now.getDate();
              const tasks = tasksByDay[day] || [];
              const hasOverdue = tasks.some(
                (t) => t.deadline && new Date(t.deadline) < now
              );

              return (
                <div
                  key={i}
                  className={`aspect-square rounded-xl p-1.5 flex flex-col transition-all hover:shadow-sm cursor-default border ${
                    isToday
                      ? "bg-[#6366f1] text-white border-[#6366f1]"
                      : tasks.length > 0
                      ? "bg-[#f8f7ff] border-[#e0dff8]"
                      : "border-transparent hover:bg-[#f8f7ff]"
                  }`}
                >
                  <span className={`text-xs font-bold ${isToday ? "text-white" : "text-[#1a1a2e]"}`}>
                    {day}
                  </span>
                  {tasks.length > 0 && (
                    <div className="flex flex-wrap gap-0.5 mt-auto">
                      {tasks.slice(0, 3).map((t, ti) => {
                        const c = t.courses as any;
                        return (
                          <div
                            key={ti}
                            className="w-1.5 h-1.5 rounded-full"
                            style={{
                              background:
                                hasOverdue && new Date(t.deadline!) < now
                                  ? "#ef4444"
                                  : c?.color || "#6366f1",
                            }}
                            title={t.title}
                          />
                        );
                      })}
                      {tasks.length > 3 && (
                        <span className={`text-[8px] font-bold ${isToday ? "text-white/70" : "text-[#9ca3af]"}`}>
                          +{tasks.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming list */}
        <div className="card p-6">
          <h2 className="text-lg font-bold text-[#1a1a2e] mb-4">Tugas Bulan Ini</h2>
          {safeAssignments.length === 0 ? (
            <p className="text-sm text-[#9ca3af] text-center py-8">Tidak ada tugas bulan ini. 🎉</p>
          ) : (
            <div className="space-y-2">
              {(safeAssignments as any[]).map((task) => {
                const course = task.courses;
                const dl = new Date(task.deadline);
                const isOver = dl < now;
                const diffDays = Math.ceil((dl.getTime() - now.getTime()) / 86400000);

                return (
                  <div key={task.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-[#f8f7ff] transition-colors">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold"
                      style={{
                        background: `${course?.color || "#6366f1"}18`,
                        color: course?.color || "#6366f1",
                      }}
                    >
                      {dl.getDate()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1a1a2e] truncate">{task.title}</p>
                      <p className="text-xs text-[#9ca3af]">{course?.name || "Tanpa Mata Kuliah"}</p>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        isOver
                          ? "bg-[#fef2f2] text-[#ef4444]"
                          : diffDays <= 3
                          ? "bg-[#fffbeb] text-[#f59e0b]"
                          : "bg-[#f0fdf4] text-[#22c55e]"
                      }`}
                    >
                      {isOver ? "Terlambat" : diffDays === 0 ? "Hari ini" : `${diffDays} hari lagi`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
