import { createClient } from "@/utils/supabase/server";
import SettingsClient from "@/components/settings/SettingsClient";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: telegramConn } = await supabase
    .from("telegram_connections")
    .select("*")
    .eq("user_id", user!.id)
    .single();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <header className="px-8 py-6 border-b border-[#f0eef8] bg-white sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-[#1a1a2e]">Settings</h1>
        <p className="text-sm text-[#9ca3af] mt-0.5">Kelola akun dan integrasi</p>
      </header>
      <main className="flex-1 px-8 py-6 max-w-2xl space-y-6">
        {/* Profile */}
        <div className="card p-6">
          <h2 className="text-base font-bold text-[#1a1a2e] mb-4">Profil</h2>
          <div className="flex items-center gap-4">
            {user?.user_metadata?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.user_metadata.avatar_url}
                alt="Avatar"
                className="w-14 h-14 rounded-full object-cover"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-[#6366f1] flex items-center justify-center text-white text-lg font-bold">
                {(user?.user_metadata?.full_name || user?.email || "U").charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-semibold text-[#1a1a2e]">
                {user?.user_metadata?.full_name || user?.user_metadata?.name || "Pengguna"}
              </p>
              <p className="text-sm text-[#9ca3af]">{user?.email}</p>
              <p className="text-xs text-[#9ca3af] mt-0.5">
                Provider: {user?.app_metadata?.provider || "email"}
              </p>
            </div>
          </div>
        </div>

        {/* Telegram */}
        <SettingsClient
          userId={user!.id}
          telegramConn={telegramConn}
          appUrl={appUrl}
        />

        {/* Sign out */}
        <div className="card p-6">
          <h2 className="text-base font-bold text-[#1a1a2e] mb-2">Keluar</h2>
          <p className="text-sm text-[#9ca3af] mb-4">
            Kamu akan keluar dari semua sesi aktif.
          </p>
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-semibold text-white bg-[#ef4444] hover:bg-[#dc2626] rounded-xl transition-colors"
            >
              Keluar dari Akun
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
