"use client";

import { useState, useTransition } from "react";
import { Course, Assignment } from "@/types";
import { createCourse, deleteCourse, updateCourse } from "@/app/actions/courses";
import { deleteTask, updateTaskStatus } from "@/app/actions/tasks";

const COLORS = [
  "#6366f1", "#22c55e", "#f59e0b", "#ef4444",
  "#3b82f6", "#a855f7", "#06b6d4", "#f97316",
];

interface CoursesClientProps {
  courses: (Course & { assignments: Assignment[] })[];
}

export default function CoursesClient({ courses }: CoursesClientProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  // Modal & Edit states
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");

  const activeCourse = courses.find((c) => c.id === selectedCourseId);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError("");
    startTransition(async () => {
      try {
        await createCourse({ name: name.trim(), color });
        setName("");
      } catch (err: any) {
        setError(err.message);
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Hapus mata kuliah ini? Tugas terkait tidak akan terhapus.")) return;
    startTransition(() => {
      deleteCourse(id);
      if (selectedCourseId === id) {
        setSelectedCourseId(null);
      }
    });
  };

  const handleEditClick = () => {
    if (!activeCourse) return;
    setEditName(activeCourse.name);
    setEditColor(activeCourse.color);
    setIsEditing(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId || !editName.trim()) return;
    startTransition(async () => {
      try {
        await updateCourse(selectedCourseId, {
          name: editName.trim(),
          color: editColor,
        });
        setIsEditing(false);
      } catch (err: any) {
        alert(err.message || "Gagal memperbarui mata kuliah");
      }
    });
  };

  const handleTaskStatusToggle = (taskId: string, currentStatus: string) => {
    const nextStatus =
      currentStatus === "completed"
        ? "pending"
        : currentStatus === "pending"
        ? "in_progress"
        : "completed";
    startTransition(() => updateTaskStatus(taskId, nextStatus));
  };

  const handleTaskDelete = (taskId: string) => {
    if (!confirm("Hapus tugas ini?")) return;
    startTransition(() => deleteTask(taskId));
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Add course form */}
      <div className="card p-6">
        <h2 className="text-base font-bold text-[#1a1a2e] dark:text-white mb-4">Tambah Mata Kuliah</h2>
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#6b7280] dark:text-gray-400 mb-1.5">Nama Mata Kuliah</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Pemrograman Web"
              className="w-full border border-[#e5e7eb] dark:border-gray-800 rounded-xl px-3.5 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1] transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#6b7280] dark:text-gray-400 mb-2">Warna</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-all ${color === c ? "ring-2 ring-offset-2 ring-[#6366f1] scale-110" : "hover:scale-105"}`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
          {error && <p className="text-xs text-[#ef4444] bg-[#fef2f2] dark:bg-red-950/20 px-3 py-2 rounded-lg">{error}</p>}
          <button
            type="submit"
            disabled={isPending || !name.trim()}
            className="w-full py-2.5 text-sm font-semibold text-white bg-[#6366f1] rounded-xl hover:bg-[#4f46e5] transition-colors disabled:opacity-50"
          >
            {isPending ? "Menyimpan..." : "Tambah Mata Kuliah"}
          </button>
        </form>
      </div>

      {/* Course list */}
      <div className="card p-6">
        <h2 className="text-base font-bold text-[#1a1a2e] dark:text-white mb-4">
          Daftar Mata Kuliah ({courses.length})
        </h2>
        {courses.length === 0 ? (
          <p className="text-sm text-[#9ca3af] text-center py-8">
            Belum ada mata kuliah. Tambahkan mata kuliah pertama!
          </p>
        ) : (
          <div className="space-y-2">
            {courses.map((course) => {
              const tasks = course.assignments || [];
              const taskCount = tasks.length;
              return (
                <div
                  key={course.id}
                  className="flex items-center gap-4 p-3.5 rounded-xl hover:bg-[#f8f7ff] dark:hover:bg-gray-800/40 transition-colors group cursor-pointer"
                  onClick={() => {
                    setSelectedCourseId(course.id);
                    setIsEditing(false);
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
                    style={{ background: course.color }}
                  >
                    {course.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[#1a1a2e] dark:text-white">{course.name}</p>
                    <p className="text-xs text-[#9ca3af]">{taskCount} tugas tercatat</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        setSelectedCourseId(course.id);
                        setEditName(course.name);
                        setEditColor(course.color);
                        setIsEditing(true);
                      }}
                      className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-lg text-[#d1d5db] hover:text-[#6366f1] hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                    >
                      <i className="fa-solid fa-pen text-xs"></i>
                    </button>
                    <button
                      onClick={() => handleDelete(course.id)}
                      disabled={isPending}
                      className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-lg text-[#d1d5db] hover:text-[#ef4444] hover:bg-[#fef2f2] dark:hover:bg-red-950/20 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Course Detail Modal */}
      {activeCourse && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-scaleUp">
            {/* Header */}
            {isEditing ? (
              <form onSubmit={handleEditSubmit} className="p-5 border-b border-[var(--card-border)] bg-gray-50/50 dark:bg-gray-900/50 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Edit Nama Mata Kuliah</label>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full border border-[#e5e7eb] dark:border-gray-800 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">Pilih Warna</label>
                  <div className="flex gap-2 flex-wrap">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setEditColor(c)}
                        className={`w-7 h-7 rounded-full transition-all ${editColor === c ? "ring-2 ring-offset-2 ring-[#6366f1] scale-110" : "hover:scale-105"}`}
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-3.5 py-1.5 rounded-xl border border-[#e5e7eb] dark:border-gray-800 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isPending || !editName.trim()}
                    className="px-4 py-1.5 rounded-xl bg-[#6366f1] text-xs font-semibold text-white hover:bg-[#4f46e5] disabled:opacity-50"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-5 border-b border-[var(--card-border)] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-8 h-8 rounded-lg shrink-0"
                    style={{ background: activeCourse.color }}
                  />
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-[#1a1a2e] dark:text-white truncate">{activeCourse.name}</h3>
                    <p className="text-xs text-[#9ca3af]">Daftar Tugas Kuliah</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleEditClick}
                    className="w-8 h-8 flex items-center justify-center rounded-xl border border-[var(--card-border)] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    title="Edit Mata Kuliah"
                  >
                    <i className="fa-solid fa-pen text-xs"></i>
                  </button>
                  <button
                    onClick={() => setSelectedCourseId(null)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl border border-[var(--card-border)] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <i className="fa-solid fa-xmark text-sm"></i>
                  </button>
                </div>
              </div>
            )}

            {/* Task list container */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3 min-h-[250px]">
              {(!activeCourse.assignments || activeCourse.assignments.length === 0) ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-10 opacity-70">
                  <span className="text-4xl mb-3">🎉</span>
                  <p className="text-sm font-semibold text-[#1a1a2e] dark:text-white">Tidak ada tugas</p>
                  <p className="text-xs text-[#9ca3af] px-6 mt-1">Mata kuliah ini bersih dari tanggungan tugas!</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {activeCourse.assignments.map((task) => {
                    const isOverdue =
                      task.status !== "completed" &&
                      task.deadline &&
                      new Date(task.deadline) < new Date();
                    const dl = task.deadline ? new Date(task.deadline) : null;

                    return (
                      <div
                        key={task.id}
                        className={`p-3 border border-[var(--card-border)] rounded-xl flex items-center gap-3 bg-white dark:bg-gray-950 transition-all ${
                          isOverdue ? "border-red-200 bg-red-50/10" : ""
                        }`}
                      >
                        {/* Status Checkbox */}
                        <button
                          onClick={() => handleTaskStatusToggle(task.id, task.status)}
                          disabled={isPending}
                          className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                            task.status === "completed"
                              ? "bg-blue-500 border-blue-500"
                              : task.status === "in_progress"
                              ? "border-green-500"
                              : "border-gray-300 dark:border-gray-700 hover:border-[#6366f1]"
                          }`}
                        >
                          {task.status === "completed" && (
                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                          {task.status === "in_progress" && (
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          )}
                        </button>

                        {/* Title and date */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p
                              className={`text-xs font-semibold truncate ${
                                task.status === "completed"
                                  ? "line-through text-gray-400"
                                  : "text-gray-800 dark:text-white"
                              }`}
                            >
                              {task.title}
                            </p>
                            <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded-full badge-${task.type}`}>
                              {task.type}
                            </span>
                          </div>
                          {dl && (
                            <p className={`text-[10px] mt-0.5 flex items-center gap-1 ${isOverdue ? "text-red-500 font-medium" : "text-gray-400"}`}>
                              <i className="fa-solid fa-calendar-days text-[9px]"></i>
                              {dl.toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                timeZone: "Asia/Jakarta",
                              })}
                              {isOverdue && " (Terlambat!)"}
                            </p>
                          )}
                        </div>

                        {/* Badges and Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded-full badge-${task.priority}`}>
                            {task.priority}
                          </span>
                          <button
                            onClick={() => handleTaskDelete(task.id)}
                            disabled={isPending}
                            className="w-6.5 h-6.5 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[var(--card-border)] bg-gray-50/30 dark:bg-gray-900/10 flex justify-end">
              <button
                onClick={() => setSelectedCourseId(null)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
