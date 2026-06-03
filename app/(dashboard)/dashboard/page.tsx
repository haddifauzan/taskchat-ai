import React from "react";
import { createClient } from "@/utils/supabase/server";
import { Assignment, DashboardStats } from "@/types";
import Link from "next/link";
import AddTaskModal from "@/components/tasks/AddTaskModal";
import { redirect } from "next/navigation";

function formatGreeting(name: string) {
  const hour = new Date().getHours();
  if (hour < 12) return `Good Morning, ${name}! 👋`;
  if (hour < 18) return `Good Afternoon, ${name}! 👋`;
  return `Good Evening, ${name}! 👋`;
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function isOverdue(deadline: string | null) {
  if (!deadline) return false;
  return new Date(deadline) < new Date() && true;
}

function formatDeadlineTime(deadline: string | null) {
  if (!deadline) return null;
  return new Date(deadline).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  pending: {
    label: "Ongoing",
    color: "#6366f1",
    bg: "#eef2ff",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  in_progress: {
    label: "In Progress",
    color: "#22c55e",
    bg: "#f0fdf4",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
  completed: {
    label: "Completed",
    color: "#3b82f6",
    bg: "#eff6ff",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  overdue: {
    label: "Overdue",
    color: "#ef4444",
    bg: "#fef2f2",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const userName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "Mahasiswa";

  const { data: rawAssignments } = await supabase
    .from("assignments")
    .select("*, courses(id, name, color)")
    .eq("user_id", user!.id)
    .order("deadline", { ascending: true, nullsFirst: false });

  const assignments = rawAssignments ?? [];

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 86400000);

  // Compute stats
  const stats: DashboardStats = {
    pending: 0,
    in_progress: 0,
    completed: 0,
    overdue: 0,
    total: assignments.length,
  };

  for (const a of assignments as Assignment[]) {
    if (a.status === "completed") {
      stats.completed++;
    } else if (a.deadline && new Date(a.deadline) < now) {
      stats.overdue++;
    } else if (a.status === "in_progress") {
      stats.in_progress++;
    } else {
      stats.pending++;
    }
  }

  // Today's tasks: deadline today OR created today
  const todayTasks = (assignments as Assignment[]).filter((a) => {
    if (a.status === "completed") return false;
    if (a.deadline) {
      const dl = new Date(a.deadline);
      return dl >= todayStart && dl < todayEnd;
    }
    return false;
  }).slice(0, 5);

  // Upcoming reminders: next 7 days
  const next7 = new Date(now.getTime() + 7 * 86400000);
  const upcomingTasks = (assignments as Assignment[])
    .filter((a) => a.status !== "completed" && a.deadline && new Date(a.deadline) <= next7 && new Date(a.deadline) >= now)
    .slice(0, 5);

  // Telegram connection status
  const { data: telegramConn } = await supabase
    .from("telegram_connections")
    .select("telegram_username")
    .eq("user_id", user!.id)
    .single();

  // Course list for modal
  const { data: courses = [] } = await supabase
    .from("courses")
    .select("*")
    .eq("user_id", user!.id)
    .order("name");

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {/* Header */}
      <header className="px-8 py-6 flex items-center justify-between border-b border-[#f0eef8] bg-white sticky top-0 z-10">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a2e]">
            {formatGreeting(userName)}
          </h1>
          <p className="text-sm text-[#9ca3af] mt-0.5">{formatDate(now)}</p>
        </div>
        <div className="flex items-center gap-3">
          <AddTaskModal courses={courses as any} />
        </div>
      </header>

      <main className="flex-1 px-8 py-6 space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {(["pending", "in_progress", "completed", "overdue"] as const).map((key) => {
            const cfg = statusConfig[key];
            return (
              <div key={key} className="card p-5 animate-fadeIn">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: cfg.bg, color: cfg.color }}
                  >
                    {cfg.icon}
                  </div>
                  <span className="text-xs font-medium text-[#9ca3af]">{cfg.label}</span>
                </div>
                <p className="text-3xl font-bold text-[#1a1a2e]">{stats[key]}</p>
                <p className="text-xs text-[#9ca3af] mt-1">Tasks</p>
              </div>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Tasks */}
          <div className="lg:col-span-2 card p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-[#1a1a2e]">Today&apos;s Tasks</h2>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs bg-[#eef2ff] text-[#6366f1] px-3 py-1 rounded-full font-medium">
                  {formatDate(todayStart)}
                </span>
                <Link href="/tasks" className="text-xs text-[#6366f1] font-medium hover:underline">
                  See all
                </Link>
              </div>
            </div>

            {todayTasks.length === 0 ? (
              <div className="text-center py-12 text-[#9ca3af]">
                <div className="text-4xl mb-3">🎉</div>
                <p className="font-medium text-sm">Tidak ada tugas untuk hari ini!</p>
                <p className="text-xs mt-1">Nikmati harimu atau tambah tugas baru.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayTasks.map((task) => {
                  const course = task.courses as any;
                  return (
                    <div
                      key={task.id}
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-[#f8f7ff] transition-colors group"
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ background: course?.color || "#6366f1" }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#1a1a2e] truncate">{task.title}</p>
                        <p className="text-xs text-[#9ca3af] truncate">{course?.name || "Tanpa Mata Kuliah"}</p>
                      </div>
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          background: course?.color ? `${course.color}18` : "#eef2ff",
                          color: course?.color || "#6366f1",
                        }}
                      >
                        {course?.name?.split(" ")[0] || task.type}
                      </span>
                      {task.deadline && (
                        <div className="flex items-center gap-1 text-xs text-[#9ca3af] shrink-0">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {formatDeadlineTime(task.deadline)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Task Summary (Donut Chart) */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#1a1a2e]">Task Summary</h2>
              <span className="text-xs bg-[#f3f4f6] text-[#6b7280] px-3 py-1 rounded-full font-medium">
                All Time
              </span>
            </div>

            {/* Donut SVG */}
            <div className="flex justify-center mb-6">
              <div className="relative w-40 h-40">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" strokeWidth="14" />
                  {stats.total > 0 && (() => {
                    const r = 40, circ = 2 * Math.PI * r;
                    const pctCompleted = stats.completed / stats.total;
                    const pctInProgress = stats.in_progress / stats.total;
                    const pctPending = stats.pending / stats.total;
                    const pctOverdue = stats.overdue / stats.total;
                    let offset = 0;
                    const segs = [
                      { pct: pctCompleted, color: "#3b82f6" },
                      { pct: pctInProgress, color: "#22c55e" },
                      { pct: pctPending, color: "#6366f1" },
                      { pct: pctOverdue, color: "#ef4444" },
                    ];
                    return segs.map((seg, i) => {
                      const dash = seg.pct * circ;
                      const gap = circ - dash;
                      const el = (
                        <circle
                          key={i}
                          cx="50" cy="50" r={r}
                          fill="none"
                          stroke={seg.color}
                          strokeWidth="14"
                          strokeDasharray={`${dash} ${gap}`}
                          strokeDashoffset={-offset * circ}
                        />
                      );
                      offset += seg.pct;
                      return el;
                    });
                  })()}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-2xl font-bold text-[#1a1a2e]">{stats.total}</p>
                  <p className="text-[10px] text-[#9ca3af]">Total Tasks</p>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-2.5">
              {[
                { label: "Ongoing", count: stats.pending, color: "#6366f1" },
                { label: "In Progress", count: stats.in_progress, color: "#22c55e" },
                { label: "Completed", count: stats.completed, color: "#3b82f6" },
                { label: "Overdue", count: stats.overdue, color: "#ef4444" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                    <span className="text-xs text-[#6b7280]">{item.label}</span>
                  </div>
                  <span className="text-xs font-semibold text-[#1a1a2e]">
                    {item.count}{" "}
                    <span className="font-normal text-[#9ca3af]">
                      ({stats.total > 0 ? Math.round((item.count / stats.total) * 100) : 0}%)
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AI Extraction & Telegram status */}
          <div className="grid grid-cols-2 gap-4 lg:col-span-1">
            <div className="card p-5">
              <div className="w-9 h-9 bg-[#eef2ff] rounded-xl flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-[#6366f1]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <p className="text-xs text-[#9ca3af] mb-1">AI Extraction</p>
              <p className="text-2xl font-bold text-[#6366f1]">98%</p>
              <p className="text-[10px] text-[#9ca3af] mt-1">Accuracy</p>
            </div>

            <div className="card p-5">
              <div className="w-9 h-9 bg-[#eff6ff] rounded-xl flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-[#3b82f6]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.016 9.504c-.146.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L6.948 14.17l-2.948-.924c-.641-.2-.654-.641.136-.953l11.521-4.441c.537-.194 1.006.131.905.396z"/>
                </svg>
              </div>
              <p className="text-xs text-[#9ca3af] mb-1">Telegram Bot</p>
              <div className="flex items-center gap-1.5 mt-1">
                <div className={`w-2 h-2 rounded-full ${telegramConn ? "bg-[#22c55e]" : "bg-[#d1d5db]"}`} />
                <span className="text-[10px] font-medium text-[#6b7280]">
                  {telegramConn ? "Connected" : "Not Connected"}
                </span>
              </div>
            </div>
          </div>

          {/* Upcoming Reminders */}
          <div className="lg:col-span-2 card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#1a1a2e]">Upcoming Reminders</h2>
              <Link href="/reminders" className="text-xs text-[#6366f1] font-medium hover:underline">
                See all
              </Link>
            </div>

            {upcomingTasks.length === 0 ? (
              <p className="text-sm text-[#9ca3af] text-center py-6">
                Tidak ada reminder dalam 7 hari ke depan.
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingTasks.map((task) => {
                  const dl = new Date(task.deadline!);
                  const diffDays = Math.ceil((dl.getTime() - now.getTime()) / 86400000);
                  const course = task.courses as any;
                  return (
                    <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#f8f7ff] transition-colors">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: `${course?.color || "#6366f1"}18`, color: course?.color || "#6366f1" }}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#1a1a2e] truncate">{task.title}</p>
                        <p className="text-xs text-[#9ca3af]">{course?.name || "Tanpa Mata Kuliah"}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-semibold text-[#6366f1]">
                          {diffDays === 0 ? "Hari ini!" : diffDays === 1 ? "Tomorrow" : `${diffDays} hari lagi`}
                        </p>
                        <p className="text-[10px] text-[#9ca3af]">
                          {dl.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
