"use client";

import { useState, useTransition, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Assignment, Course } from "@/types";
import { deleteTask, updateTaskStatus } from "@/app/actions/tasks";
import AddTaskModal from "./AddTaskModal";
import TaskDetailModal from "./TaskDetailModal";
import ConfirmModal from "@/components/ConfirmModal";

interface TasksClientProps {
  assignments: Assignment[];
  courses: Course[];
}

const statusBadge: Record<string, { label: string; cls: string }> = {
  pending: { label: "Pending", cls: "badge-pending" },
  in_progress: { label: "In Progress", cls: "badge-in_progress" },
  completed: { label: "Completed", cls: "badge-completed" },
};

const priorityBadge: Record<string, { label: string; cls: string; dot: string }> = {
  high: { label: "High", cls: "badge-high", dot: "#ef4444" },
  medium: { label: "Medium", cls: "badge-medium", dot: "#f59e0b" },
  low: { label: "Low", cls: "badge-low", dot: "#22c55e" },
};

export default function TasksClient({ assignments, courses }: TasksClientProps) {
  const searchParams = useSearchParams();
  const taskIdParam = searchParams.get("id");

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCourse, setFilterCourse] = useState<string>("all");
  const [selectedTask, setSelectedTask] = useState<Assignment | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Auto-open selected task from query param
  useEffect(() => {
    if (taskIdParam) {
      const matched = assignments.find((a) => a.id === taskIdParam);
      if (matched) {
        setSelectedTask(matched);
      }
    }
  }, [taskIdParam, assignments]);

  const now = new Date();

  const filtered = assignments.filter((a) => {
    const matchSearch =
      !search ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      (a.courses as any)?.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      filterStatus === "all" ||
      (filterStatus === "overdue"
        ? a.status !== "completed" && a.deadline && new Date(a.deadline) < now
        : a.status === filterStatus);
    const matchCourse =
      filterCourse === "all" || a.course_id === filterCourse;
    return matchSearch && matchStatus && matchCourse;
  });

  const handleDelete = (id: string) => {
    setTaskToDelete(id);
  };

  const handleConfirmDelete = () => {
    if (taskToDelete) {
      startTransition(() => deleteTask(taskToDelete));
      setTaskToDelete(null);
    }
  };

  const handleStatusChange = (id: string, status: any) => {
    startTransition(() => updateTaskStatus(id, status));
  };

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-col xl:flex-row gap-3 items-stretch xl:items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          {["all", "pending", "in_progress", "completed", "overdue"].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                filterStatus === s
                  ? "bg-[#6366f1] text-white shadow-md"
                  : "bg-white border border-[#e5e7eb] text-[#6b7280] hover:border-[#6366f1] hover:text-[#6366f1]"
              }`}
            >
              {s === "all" ? "Semua" : s === "in_progress" ? "In Progress" : s === "overdue" ? "Overdue" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 items-stretch w-full xl:w-auto">
          <div className="relative flex-1 xl:w-56">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari tugas..."
              className="w-full pl-9 pr-3.5 py-2 border border-[#e5e7eb] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1] transition-all"
            />
          </div>

          <div className="flex gap-2 items-center">
            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              className="flex-1 sm:flex-initial border border-[#e5e7eb] rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1] transition-all text-[#6b7280]"
            >
              <option value="all">Semua MK</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <AddTaskModal courses={courses} />
          </div>
        </div>
      </div>

      {/* Task list */}
      {filtered.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-lg font-semibold text-[#1a1a2e] mb-2">Tidak ada tugas ditemukan</p>
          <p className="text-sm text-[#9ca3af]">Tambahkan tugas baru atau ubah filter pencarian.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((task) => {
            const course = task.courses as any;
            const isOverdue = task.status !== "completed" && task.deadline && new Date(task.deadline) < now;
            const dl = task.deadline ? new Date(task.deadline) : null;

            return (
              <div
                key={task.id}
                className={`card p-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-4 hover:shadow-md transition-all duration-200 animate-fadeIn ${
                  isOverdue ? "border-[#fca5a5]" : ""
                }`}
              >
                {/* Upper section: Checkbox + Vertical Bar + Title/Meta */}
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  {/* Status toggle */}
                  <button
                    onClick={() =>
                      handleStatusChange(
                        task.id,
                        task.status === "completed"
                          ? "pending"
                          : task.status === "pending"
                          ? "in_progress"
                          : "completed"
                      )
                    }
                    disabled={isPending}
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                      task.status === "completed"
                        ? "bg-[#3b82f6] border-[#3b82f6]"
                        : task.status === "in_progress"
                        ? "border-[#22c55e]"
                        : "border-[#d1d5db] hover:border-[#6366f1]"
                    }`}
                  >
                    {task.status === "completed" && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {task.status === "in_progress" && (
                      <div className="w-2 h-2 rounded-full bg-[#22c55e]" />
                    )}
                  </button>

                  {/* Course color indicator bar */}
                  <div
                    className="w-1 h-9 rounded-full shrink-0"
                    style={{ background: course?.color || "#e5e7eb" }}
                  />

                  {/* Clickable Area for Details */}
                  <div
                    onClick={() => setSelectedTask(task)}
                    className="flex-1 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <p
                        className={`text-sm font-semibold truncate ${
                          task.status === "completed"
                            ? "line-through text-[#9ca3af]"
                            : "text-[#1a1a2e] dark:text-white"
                        }`}
                      >
                        {task.title}
                      </p>
                      <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full badge-${task.type}`}>
                        {task.type}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-[#6b7280]">
                      {course && (
                        <span className="font-medium text-[#4f46e5] dark:text-[#a5b4fc]">{course.name}</span>
                      )}
                      {dl && (
                        <span className={`flex items-center gap-1 ${isOverdue ? "text-[#ef4444] font-semibold" : "text-[#9ca3af]"}`}>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {dl.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" })}
                          {isOverdue && " (Terlambat!)"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Lower section: Badges + Delete Button */}
                <div className="flex items-center justify-between md:justify-end gap-3 pl-8 md:pl-0 border-t border-gray-50 md:border-t-0 pt-2 md:pt-0 shrink-0">
                  {/* Badges */}
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full badge-${task.priority}`}>
                      {priorityBadge[task.priority]?.label || task.priority}
                    </span>
                    <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full badge-${task.status}`}>
                      {statusBadge[task.status]?.label || task.status}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDelete(task.id)}
                      disabled={isPending}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-[#d1d5db] hover:text-[#ef4444] hover:bg-[#fef2f2] dark:hover:bg-red-950/30 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          courses={courses}
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!taskToDelete}
        title="Hapus Tugas"
        message="Apakah Anda yakin ingin menghapus tugas ini? Tindakan ini tidak dapat dibatalkan."
        onConfirm={handleConfirmDelete}
        onCancel={() => setTaskToDelete(null)}
      />
    </div>
  );
}

