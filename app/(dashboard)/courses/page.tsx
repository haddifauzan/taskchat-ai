import { createClient } from "@/utils/supabase/server";
import CoursesClient from "@/components/courses/CoursesClient";
import { redirect } from "next/navigation";

export default async function CoursesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: courses = [] } = await supabase
    .from("courses")
    .select("*, assignments(*)")
    .eq("user_id", user!.id)
    .order("name");

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <header className="px-8 py-6 border-b border-[#f0eef8] bg-white sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-[#1a1a2e]">Courses</h1>
        <p className="text-sm text-[#9ca3af] mt-0.5">Kelola mata kuliah dan tugasnya</p>
      </header>
      <main className="flex-1 px-8 py-6">
        <CoursesClient courses={courses as any} />
      </main>
    </div>
  );
}
