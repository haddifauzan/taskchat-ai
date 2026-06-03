import { createClient } from "@/utils/supabase/server";
import NotificationMenu from "@/components/NotificationMenu";
import { redirect } from "next/navigation";

export default async function ChatPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }
  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <header className="px-8 py-6 flex items-center justify-between border-b border-[#f0eef8] bg-white sticky top-0 z-10">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a2e]">Chat with Bot</h1>
          <p className="text-sm text-[#9ca3af] mt-0.5">Panduan menggunakan TaskChat AI Bot</p>
        </div>
        <div className="flex items-center gap-3">
          <NotificationMenu />
        </div>
      </header>
      <main className="flex-1 px-8 py-6 max-w-2xl">
        <div className="card p-8 text-center space-y-6">
          <div className="w-20 h-20 mx-auto bg-[#eff6ff] rounded-2xl flex items-center justify-center">
            <svg className="w-10 h-10 text-[#3b82f6]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.016 9.504c-.146.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L6.948 14.17l-2.948-.924c-.641-.2-.654-.641.136-.953l11.521-4.441c.537-.194 1.006.131.905.396z"/>
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#1a1a2e] mb-2">Gunakan Telegram Bot</h2>
            <p className="text-sm text-[#6b7280] leading-relaxed">
              TaskChat AI bekerja melalui Telegram Bot. Kamu cukup mengirim pesan tentang tugasmu,
              dan AI akan otomatis mengekstrak dan menyimpan ke dashboard.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 text-left">
            {[
              {
                msg: "\"Tugas AI membuat chatbot deadline senin depan\"",
                desc: "Tambah tugas baru: mendeteksi mata kuliah, judul, dan deadline secara otomatis",
              },
              {
                msg: "\"Ubah deadline tugas membuat chatbot AI jadi besok\"",
                desc: "Ubah detail tugas: memperbarui deadline, judul, prioritas, tipe, atau deskripsi",
              },
              {
                msg: "\"Tugas membuat chatbot AI sudah selesai\"",
                desc: "Ubah status tugas: mengubah status ke completed (selesai) atau in_progress (sedang dikerjakan)",
              },
              {
                msg: "\"Hapus tugas membuat chatbot AI\"",
                desc: "Hapus tugas: menghapus tugas tertentu dari daftar secara permanen",
              },
            ].map((ex, i) => (
              <div key={i} className="p-4 bg-[#f8f7ff] border border-[#e0dff8] rounded-xl">
                <p className="text-sm font-medium text-[#6366f1] mb-1">{ex.msg}</p>
                <p className="text-xs text-[#9ca3af]">→ {ex.desc}</p>
              </div>
            ))}
          </div>

          <a
            href={`https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "taskchat_ai_bot"}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors shadow-md shadow-[#3b82f6]/25"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.016 9.504c-.146.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L6.948 14.17l-2.948-.924c-.641-.2-.654-.641.136-.953l11.521-4.441c.537-.194 1.006.131.905.396z"/>
            </svg>
            Buka Telegram Bot
          </a>

          <p className="text-xs text-[#9ca3af]">
            Belum terhubung?{" "}
            <a href="/settings" className="text-[#6366f1] hover:underline font-medium">
              Hubungkan Telegram di Settings
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
