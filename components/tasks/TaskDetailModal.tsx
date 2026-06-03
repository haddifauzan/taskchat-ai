"use client";

import { useState, useTransition } from "react";
import { updateTask } from "@/app/actions/tasks";
import { Assignment, Course, TaskPriority, TaskStatus, TaskType } from "@/types";

interface TaskDetailModalProps {
  task: Assignment;
  courses: Course[];
  isOpen: boolean;
  onClose: () => void;
}

const statusBadge: Record<string, { label: string; cls: string }> = {
  pending: { label: "Pending", cls: "badge-pending" },
  in_progress: { label: "In Progress", cls: "badge-in_progress" },
  completed: { label: "Completed", cls: "badge-completed" },
};

const priorityBadge: Record<string, { label: string; cls: string }> = {
  high: { label: "High", cls: "badge-high" },
  medium: { label: "Medium", cls: "badge-medium" },
  low: { label: "Low", cls: "badge-low" },
};

export default function TaskDetailModal({
  task,
  courses,
  isOpen,
  onClose,
}: TaskDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  if (!isOpen) return null;

  // Format ISO string to datetime-local value (YYYY-MM-DDThh:mm)
  const formatDatetimeLocal = (isoString: string | null) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    const partMap = Object.fromEntries(parts.map((p) => [p.type, p.value]));
    return `${partMap.year}-${partMap.month}-${partMap.day}T${partMap.hour}:${partMap.minute}`;
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        await updateTask(task.id, {
          title: fd.get("title") as string,
          course_id: fd.get("course_id") as string || undefined,
          type: fd.get("type") as TaskType,
          deadline: fd.get("deadline") as string || undefined,
          priority: fd.get("priority") as TaskPriority,
          status: fd.get("status") as TaskStatus,
          description: fd.get("description") as string || "",
        });
        setIsEditing(false);
      } catch (err: any) {
        setError(err.message || "Gagal memperbarui tugas");
      }
    });
  };

  const course = task.courses as any;
  const dl = task.deadline ? new Date(task.deadline) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-[var(--card)] border border-[var(--card-border)] rounded-2xl shadow-2xl w-full max-w-lg animate-fadeIn p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5 border-b border-[var(--sidebar-border)] pb-3">
          <h2 className="text-lg font-bold text-[var(--foreground)]">
            {isEditing ? "Edit Tugas" : "Detail Tugas"}
          </h2>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 text-xs font-semibold text-[var(--primary)] hover:bg-[var(--primary-bg)] rounded-lg transition-colors"
              >
                <i className="fa-solid fa-pen-to-square mr-1.5"></i> Edit
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--card-border)] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>
        </div>

        {error && (
          <p className="text-xs text-[#ef4444] bg-[var(--danger-bg)] border border-[#fca5a5] px-3 py-2.5 rounded-xl mb-4">
            {error}
          </p>
        )}

        {isEditing ? (
          /* EDIT MODE FORM */
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--muted)] mb-1.5">Judul Tugas *</label>
              <input
                name="title"
                defaultValue={task.title}
                required
                className="w-full border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--muted)] mb-1.5">Mata Kuliah</label>
                <select
                  name="course_id"
                  defaultValue={task.course_id || ""}
                  className="w-full border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-all"
                >
                  <option value="">Pilih Mata Kuliah</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--muted)] mb-1.5">Tipe</label>
                <select
                  name="type"
                  defaultValue={task.type}
                  className="w-full border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-all"
                >
                  {["tugas", "quiz", "tubes", "presentasi", "praktikum"].map((t) => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
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
                  defaultValue={formatDatetimeLocal(task.deadline)}
                  className="w-full border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--muted)] mb-1.5">Prioritas</label>
                <select
                  name="priority"
                  defaultValue={task.priority}
                  className="w-full border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-all"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--muted)] mb-1.5">Status</label>
              <select
                name="status"
                defaultValue={task.status}
                className="w-full border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-all"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--muted)] mb-1.5">Deskripsi</label>
              <textarea
                name="description"
                rows={3}
                defaultValue={task.description || ""}
                placeholder="Tambahkan deskripsi tugas..."
                className="w-full border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] resize-none transition-all"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 py-2.5 text-sm font-medium text-[var(--muted)] border border-[var(--border)] rounded-xl hover:bg-[var(--card-border)] transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-[var(--primary)] rounded-xl hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-50"
              >
                {isPending ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </form>
        ) : (
          /* VIEW DETAILS MODE */
          <div className="space-y-4 text-sm">
            {/* Title & Status */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full badge-${task.status}`}>
                  {statusBadge[task.status]?.label || task.status}
                </span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full badge-${task.priority}`}>
                  {priorityBadge[task.priority]?.label || task.priority}
                </span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full badge-${task.type}`}>
                  {task.type}
                </span>
              </div>
              <h3 className="text-xl font-bold text-[var(--foreground)]">{task.title}</h3>
            </div>

            {/* Course & Deadline */}
            <div className="grid grid-cols-2 gap-4 bg-[var(--sidebar-bg)] p-3.5 rounded-xl border border-[var(--card-border)]">
              <div>
                <p className="text-[10px] font-bold text-[var(--muted-light)] uppercase tracking-wider mb-0.5">Mata Kuliah</p>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: course?.color || "var(--border)" }} />
                  <span className="font-semibold text-[var(--foreground)]">{course?.name || "Tidak ada MK"}</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-[var(--muted-light)] uppercase tracking-wider mb-0.5">Deadline</p>
                <span className="font-semibold text-[var(--foreground)]">
                  {dl ? dl.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" }) : "Tidak ada"}
                </span>
              </div>
            </div>

            {/* Description */}
            <div>
              <p className="text-[10px] font-bold text-[var(--muted-light)] uppercase tracking-wider mb-1">Deskripsi</p>
              <div className="p-3.5 bg-[var(--background)] rounded-xl border border-[var(--card-border)] text-[var(--foreground)] whitespace-pre-wrap min-h-[60px]">
                {task.description || <span className="text-[var(--muted-light)] italic">Tidak ada deskripsi</span>}
              </div>
            </div>

            {/* Source text from Telegram bot */}
            {task.source_text && (
              <div>
                <p className="text-[10px] font-bold text-[var(--muted-light)] uppercase tracking-wider mb-1">
                  <i className="fa-brands fa-telegram text-[#3b82f6] mr-1"></i> Teks Asli dari Telegram
                </p>
                <div className="p-3.5 bg-[var(--background)] rounded-xl border border-[var(--card-border)] text-xs text-[var(--muted)] font-mono whitespace-pre-wrap">
                  {task.source_text}
                </div>
              </div>
            )}

            {/* Created At info */}
            <div className="text-[10px] text-[var(--muted-light)] text-right">
              Dibuat pada: {new Date(task.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
