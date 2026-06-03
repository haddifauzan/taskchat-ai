"use client";

import { useState, useTransition } from "react";
import { Course } from "@/types";
import { createCourse, deleteCourse } from "@/app/actions/courses";

const COLORS = [
  "#6366f1", "#22c55e", "#f59e0b", "#ef4444",
  "#3b82f6", "#a855f7", "#06b6d4", "#f97316",
];

interface CoursesClientProps {
  courses: (Course & { assignments: { count: number }[] })[];
}

export default function CoursesClient({ courses }: CoursesClientProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

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
    startTransition(() => deleteCourse(id));
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Add course form */}
      <div className="card p-6">
        <h2 className="text-base font-bold text-[#1a1a2e] mb-4">Tambah Mata Kuliah</h2>
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#6b7280] mb-1.5">Nama Mata Kuliah</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Pemrograman Web"
              className="w-full border border-[#e5e7eb] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1] transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#6b7280] mb-2">Warna</label>
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
          {error && <p className="text-xs text-[#ef4444] bg-[#fef2f2] px-3 py-2 rounded-lg">{error}</p>}
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
        <h2 className="text-base font-bold text-[#1a1a2e] mb-4">
          Daftar Mata Kuliah ({courses.length})
        </h2>
        {courses.length === 0 ? (
          <p className="text-sm text-[#9ca3af] text-center py-8">
            Belum ada mata kuliah. Tambahkan mata kuliah pertama!
          </p>
        ) : (
          <div className="space-y-2">
            {courses.map((course) => {
              const taskCount = course.assignments?.[0]?.count || 0;
              return (
                <div
                  key={course.id}
                  className="flex items-center gap-4 p-3.5 rounded-xl hover:bg-[#f8f7ff] transition-colors group"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
                    style={{ background: course.color }}
                  >
                    {course.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[#1a1a2e]">{course.name}</p>
                    <p className="text-xs text-[#9ca3af]">{taskCount} tugas</p>
                  </div>
                  <button
                    onClick={() => handleDelete(course.id)}
                    disabled={isPending}
                    className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-lg text-[#d1d5db] hover:text-[#ef4444] hover:bg-[#fef2f2] transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
