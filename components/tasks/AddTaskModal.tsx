"use client";

import { useState, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import { createTask } from "@/app/actions/tasks";
import { Course, TaskPriority, TaskStatus, TaskType } from "@/types";

interface AddTaskModalProps {
  courses: Course[];
}

export default function AddTaskModal({ courses }: AddTaskModalProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        await createTask({
          title: fd.get("title") as string,
          description: (fd.get("description") as string) || undefined,
          deadline: (fd.get("deadline") as string) || undefined,
          priority: (fd.get("priority") as TaskPriority) || "medium",
          status: "pending" as TaskStatus,
          type: (fd.get("type") as TaskType) || "tugas",
          course_id: (fd.get("course_id") as string) || undefined,
        });
        setOpen(false);
        (e.target as HTMLFormElement).reset();
      } catch (err: any) {
        setError(err.message);
      }
    });
  };

  const modalContent = open && (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <div className="relative bg-[var(--card)] border border-[var(--card-border)] rounded-2xl shadow-2xl w-full max-w-lg animate-fadeIn p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-[var(--foreground)]">Tambah Tugas Baru</h2>
          <button
            onClick={() => setOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--card-border)] transition-colors text-[var(--muted)] hover:text-[var(--foreground)] cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--muted)] mb-1.5">Judul Tugas *</label>
            <input
              name="title"
              required
              placeholder="Contoh: Bikin laporan praktikum"
              className="w-full border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--muted)] mb-1.5">Mata Kuliah</label>
              <select
                name="course_id"
                className="w-full border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-all"
              >
                <option value="">Pilih Mata Kuliah</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--muted)] mb-1.5">Tipe</label>
              <select
                name="type"
                className="w-full border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-all"
              >
                {["tugas", "quiz", "tubes", "presentasi", "praktikum"].map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--muted)] mb-1.5">Deadline</label>
              <input
                name="deadline"
                type="datetime-local"
                className="w-full border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--muted)] mb-1.5">Prioritas</label>
              <select
                name="priority"
                className="w-full border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-all"
              >
                <option value="high">🔴 High</option>
                <option value="medium" selected>
                  🟡 Medium
                </option>
                <option value="low">🟢 Low</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--muted)] mb-1.5">Deskripsi</label>
            <textarea
              name="description"
              rows={3}
              placeholder="Tambahkan deskripsi tugas..."
              className="w-full border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] resize-none transition-all"
            />
          </div>

          {error && (
            <p className="text-xs text-[#ef4444] bg-[var(--danger-bg)] border border-[#fca5a5] px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 py-2.5 text-sm font-medium text-[var(--muted)] border border-[var(--border)] rounded-xl hover:bg-[var(--card-border)] transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-2.5 text-sm font-semibold text-white bg-[#6366f1] rounded-xl hover:bg-[#4f46e5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? "Menyimpan..." : "Simpan Tugas"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        id="add-task-btn"
        className="flex items-center gap-2 bg-[#6366f1] hover:bg-[#4f46e5] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 shadow-md shadow-[#6366f1]/25 hover:shadow-lg hover:shadow-[#6366f1]/30 hover:-translate-y-0.5"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Add Task
      </button>

      {mounted && open ? createPortal(modalContent, document.body) : null}
    </>
  );
}
