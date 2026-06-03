"use client";

import { useState } from "react";

interface CalendarClientProps {
  initialAssignments: any[];
}

export default function CalendarClient({ initialAssignments }: CalendarClientProps) {
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(now.getDate());

  // Navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedDay(null);
  };

  // Helper values
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const monthLabel = new Date(currentYear, currentMonth, 1).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });

  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

  // Generate cells
  const cells: (number | null)[] = [
    ...Array(firstDayIndex).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  // Filter assignments for current month & year
  const currentMonthAssignments = initialAssignments.filter((a) => {
    if (!a.deadline) return false;
    const d = new Date(a.deadline);
    const y = parseInt(new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Jakarta", year: "numeric" }).format(d), 10);
    const m = parseInt(new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Jakarta", month: "numeric" }).format(d), 10) - 1;
    return y === currentYear && m === currentMonth;
  });

  // Group by day for indicators
  const tasksByDay: Record<number, any[]> = {};
  for (const a of currentMonthAssignments) {
    if (a.deadline) {
      const day = parseInt(new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Jakarta", day: "numeric" }).format(new Date(a.deadline)), 10);
      if (!tasksByDay[day]) tasksByDay[day] = [];
      tasksByDay[day].push(a);
    }
  }

  // Assignments for selected day
  const selectedDayTasks = selectedDay ? tasksByDay[selectedDay] || [] : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* LEFT COLUMN: Compact Interactive Calendar */}
      <div className="card p-6 lg:col-span-7 bg-white shadow-sm border border-[#f0eef8] rounded-2xl">
        {/* Header navigasi bulan */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevMonth}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#1a1a2e] transition-colors cursor-pointer"
            >
              <i className="fa-solid fa-chevron-left text-sm"></i>
            </button>
            <h2 className="text-base font-bold text-[#1a1a2e] min-w-[140px] text-center capitalize">
              {monthLabel}
            </h2>
            <button
              onClick={handleNextMonth}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#1a1a2e] transition-colors cursor-pointer"
            >
              <i className="fa-solid fa-chevron-right text-sm"></i>
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold text-[#9ca3af]">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#6366f1] inline-block" />
              Tugas aktif
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444] inline-block" />
              Terlambat
            </span>
          </div>
        </div>

        {/* Nama Hari */}
        <div className="grid grid-cols-7 gap-2 mb-2 text-center">
          {dayNames.map((d) => (
            <div key={d} className="text-xs font-bold text-[#9ca3af] py-1.5 uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>

        {/* Kotak-kotak Tanggal */}
        <div className="grid grid-cols-7 gap-2">
          {cells.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} className="aspect-square" />;

            const isToday =
              day === now.getDate() &&
              currentMonth === now.getMonth() &&
              currentYear === now.getFullYear();

            const isSelected = day === selectedDay;
            const tasks = tasksByDay[day] || [];
            const hasOverdue = tasks.some(
              (t) => t.deadline && new Date(t.deadline) < now && t.status !== "completed"
            );

            return (
              <button
                key={`day-${day}`}
                onClick={() => setSelectedDay(day)}
                className={`aspect-square rounded-xl p-1.5 flex flex-col items-center justify-between border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#6366f1] text-white border-[#6366f1] shadow-lg shadow-[#6366f1]/25 scale-105"
                    : isToday
                    ? "bg-[#e0e7ff] text-[#6366f1] border-[#c7d2fe]"
                    : tasks.length > 0
                    ? "bg-[#f8f7ff] border-[#e0dff8] text-[#1a1a2e] hover:border-[#6366f1]"
                    : "border-transparent text-[#4b5563] hover:bg-[#f3f4f6]"
                }`}
              >
                <span className="text-xs font-extrabold">{day}</span>
                {tasks.length > 0 && (
                  <div className="flex justify-center gap-1 mt-1">
                    {tasks.slice(0, 3).map((t, ti) => {
                      const c = t.courses;
                      const isOver = new Date(t.deadline!) < now && t.status !== "completed";
                      return (
                        <span
                          key={ti}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{
                            background: isOver ? "#ef4444" : c?.color || "#6366f1",
                          }}
                          title={t.title}
                        />
                      );
                    })}
                    {tasks.length > 3 && (
                      <span
                        className={`text-[8px] font-bold leading-none ${
                          isSelected ? "text-white/80" : "text-[#9ca3af]"
                        }`}
                      >
                        +
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT COLUMN: Interactive Task Detail & Monthly Summary */}
      <div className="lg:col-span-5 space-y-6">
        {/* BAGIAN 1: Detail Tanggal yang Dipilih */}
        {selectedDay && (
          <div className="card p-6 bg-white shadow-sm border border-[#f0eef8] rounded-2xl">
            <div className="flex items-center justify-between border-b border-[#f0eef8] pb-3 mb-4">
              <h3 className="font-extrabold text-[#1a1a2e] flex items-center gap-2">
                <i className="fa-solid fa-calendar-day text-[#6366f1]"></i>
                Tugas Tanggal {selectedDay} {monthLabel}
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#f3f4f6] text-[#6b7280]">
                {selectedDayTasks.length} Tugas
              </span>
            </div>

            {selectedDayTasks.length === 0 ? (
              <div className="text-center py-6 text-[#9ca3af] space-y-2">
                <i className="fa-solid fa-circle-check text-2xl text-[#22c55e]"></i>
                <p className="text-xs font-medium">Bebas tugas! Tidak ada deadline hari ini.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDayTasks.map((task) => {
                  const course = task.courses;
                  const dl = new Date(task.deadline);
                  const isOver = dl < now && task.status !== "completed";
                  const priorityColors: Record<string, string> = {
                    high: "bg-red-50 text-red-600 border-red-100",
                    medium: "bg-amber-50 text-amber-600 border-amber-100",
                    low: "bg-blue-50 text-blue-600 border-blue-100",
                  };

                  return (
                    <div
                      key={task.id}
                      className="p-4 rounded-xl border border-[#f0eef8] bg-[#faf9ff] hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <span
                            className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full"
                            style={{
                              background: `${course?.color || "#6366f1"}15`,
                              color: course?.color || "#6366f1",
                            }}
                          >
                            {course?.name || "Tanpa Matkul"}
                          </span>
                          <h4 className="text-sm font-bold text-[#1a1a2e] mt-1">{task.title}</h4>
                        </div>
                        <span
                          className={`text-[9px] font-extrabold uppercase px-2 py-0.5 border rounded-full ${
                            priorityColors[task.priority] || "bg-gray-50"
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>

                      {task.description && (
                        <p className="text-xs text-[#6b7280] mb-3 leading-relaxed">
                          {task.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-[#9ca3af] border-t border-[#f0eef8]/80 pt-2.5">
                        <span className="flex items-center gap-1">
                          <i className="fa-solid fa-clock"></i>
                          {dl.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" })} WIB
                        </span>
                        <span className="flex items-center gap-1 font-semibold capitalize text-[#6366f1]">
                          <i className="fa-solid fa-circle-info"></i>
                          {task.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* BAGIAN 2: Semua Tugas Bulan Ini */}
        <div className="card p-6 bg-white shadow-sm border border-[#f0eef8] rounded-2xl">
          <h3 className="font-extrabold text-[#1a1a2e] mb-4 flex items-center gap-2">
            <i className="fa-solid fa-list-check text-[#6366f1]"></i>
            Semua Tugas Bulan Ini
          </h3>
          {currentMonthAssignments.length === 0 ? (
            <div className="text-center py-8 text-[#9ca3af] space-y-2">
              <i className="fa-solid fa-face-smile text-3xl text-[#22c55e]"></i>
              <p className="text-sm font-medium">Bulan ini santai! Tidak ada tugas.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {currentMonthAssignments.map((task) => {
                const course = task.courses;
                const dl = new Date(task.deadline);
                const isOver = dl < now && task.status !== "completed";
                const diffDays = Math.ceil((dl.getTime() - now.getTime()) / 86400000);

                return (
                  <div
                    key={task.id}
                    onClick={() => setSelectedDay(dl.getDate())}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#f8f7ff] border border-transparent hover:border-[#e0dff8] transition-all cursor-pointer"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0 text-[10px] font-bold"
                      style={{
                        background: `${course?.color || "#6366f1"}12`,
                        color: course?.color || "#6366f1",
                      }}
                    >
                      <span className="text-xs font-extrabold">
                        {new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", day: "numeric" }).format(dl)}
                      </span>
                      <span className="uppercase text-[8px]">
                        {dl.toLocaleDateString("id-ID", { month: "short", timeZone: "Asia/Jakarta" })}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-[#1a1a2e] truncate">{task.title}</p>
                      <p className="text-[10px] text-[#9ca3af]">{course?.name || "Tanpa Matkul"}</p>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isOver
                          ? "bg-[#fef2f2] text-[#ef4444]"
                          : diffDays <= 3
                          ? "bg-[#fffbeb] text-[#f59e0b]"
                          : "bg-[#f0fdf4] text-[#22c55e]"
                      }`}
                    >
                      {isOver
                        ? "Terlambat"
                        : diffDays === 0
                        ? "Hari Ini"
                        : `${diffDays} hr lagi`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
