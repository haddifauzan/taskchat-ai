import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import CalendarClient from "@/components/calendar/CalendarClient";

export default async function CalendarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Ambil semua tugas belum selesai milik user agar bisa dinavigasikan di kalender
  const { data: assignments = [] } = await supabase
    .from("assignments")
    .select("*, courses(id, name, color)")
    .eq("user_id", user.id)
    .neq("status", "completed")
    .order("deadline", { ascending: true });

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <header className="px-8 py-6 border-b border-[#f0eef8] bg-white sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-calendar-days text-[#6366f1] text-xl"></i>
          <h1 className="text-2xl font-extrabold text-[#1a1a2e]">Calendar</h1>
        </div>
        <p className="text-sm text-[#9ca3af] mt-0.5">Lihat dan kelola timeline penugasanmu secara interaktif</p>
      </header>

      <main className="flex-1 px-8 py-6">
        <CalendarClient initialAssignments={assignments ?? []} />
      </main>
    </div>
  );
}

