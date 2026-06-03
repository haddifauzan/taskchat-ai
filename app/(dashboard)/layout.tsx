import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/sidebar/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const userName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "Pengguna";

  const userEmail = user.email || "";
  const userAvatar = user.user_metadata?.avatar_url || null;

  return (
    <div className="flex min-h-screen bg-[#f8f7ff]">
      <Sidebar userName={userName} userEmail={userEmail} userAvatar={userAvatar} />
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {children}
      </div>
    </div>
  );
}
