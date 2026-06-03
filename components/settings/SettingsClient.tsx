"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface SettingsClientProps {
  userId: string;
  telegramConn: any;
  appUrl: string;
}

export default function SettingsClient({ userId, telegramConn, appUrl }: SettingsClientProps) {
  const router = useRouter();
  const [telegramId, setTelegramId] = useState("");
  const [telegramUsername, setTelegramUsername] = useState("");
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!telegramId.trim()) return;
    setError(""); setSuccess("");

    startTransition(async () => {
      try {
        const res = await fetch("/api/telegram/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            telegram_id: parseInt(telegramId),
            telegram_username: telegramUsername || null,
          }),
        });
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error || "Gagal menghubungkan");
        }
        setSuccess("Telegram berhasil dihubungkan! Sekarang kamu bisa kirim tugas via bot.");
        setTelegramId("");
        setTelegramUsername("");
        router.refresh();
      } catch (err: any) {
        setError(err.message);
      }
    });
  };

  const handleDisconnect = async () => {
    if (!confirm("Apakah Anda yakin ingin memutuskan hubungan Telegram?")) return;
    setError(""); setSuccess("");

    startTransition(async () => {
      try {
        const res = await fetch("/api/telegram/disconnect", {
          method: "POST",
        });
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error || "Gagal memutuskan koneksi");
        }
        setSuccess("Hubungan Telegram berhasil diputuskan.");
        router.refresh();
      } catch (err: any) {
        setError(err.message);
      }
    });
  };

  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "taskchat_ai_bot";

  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-9 h-9 rounded-xl bg-[#eff6ff] flex items-center justify-center">
          <svg className="w-5 h-5 text-[#3b82f6]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.016 9.504c-.146.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L6.948 14.17l-2.948-.924c-.641-.2-.654-.641.136-.953l11.521-4.441c.537-.194 1.006.131.905.396z"/>
          </svg>
        </div>
        <div>
          <h2 className="text-base font-bold text-[#1a1a2e]">Telegram Bot</h2>
          <p className="text-xs text-[#9ca3af]">
            {telegramConn ? "✅ Terhubung" : "Belum terhubung"}
          </p>
        </div>
      </div>

      {telegramConn ? (
        <div className="mt-4 p-4 bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl">
          <p className="text-sm font-semibold text-[#15803d]">
            Bot aktif! Telegram ID: <code className="bg-[#dcfce7] px-1.5 py-0.5 rounded text-xs">{telegramConn.telegram_id}</code>
          </p>
          {telegramConn.telegram_username && (
            <p className="text-xs text-[#16a34a] mt-1">@{telegramConn.telegram_username}</p>
          )}
          <p className="text-xs text-[#6b7280] mt-2 mb-4">
            Kirim pesan ke{" "}
            <a href={`https://t.me/${botUsername}`} target="_blank" rel="noreferrer" className="text-[#3b82f6] hover:underline font-medium">
              @{botUsername}
            </a>{" "}
            untuk menyimpan tugas via Telegram.
          </p>
          <button
            onClick={handleDisconnect}
            disabled={isPending}
            className="w-full py-2 px-4 text-xs font-semibold text-white bg-[#ef4444] hover:bg-[#dc2626] rounded-xl transition-colors disabled:opacity-50"
          >
            {isPending ? "Memproses..." : "Putuskan Hubungan Telegram"}
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="p-4 bg-[#fffbeb] border border-[#fde68a] rounded-xl space-y-2">
            <p className="text-sm font-semibold text-[#92400e]">Cara Menghubungkan Telegram:</p>
            <ol className="text-xs text-[#78350f] space-y-1 list-decimal list-inside">
              <li>Buka Telegram dan chat ke <a href={`https://t.me/${botUsername}`} target="_blank" rel="noreferrer" className="text-[#3b82f6] underline">@{botUsername}</a></li>
              <li>Kirim pesan <code className="bg-[#fef3c7] px-1 rounded">/start</code> ke bot</li>
              <li>Cari Telegram ID kamu (gunakan bot <code>@userinfobot</code>)</li>
              <li>Masukkan Telegram ID di form di bawah ini</li>
            </ol>
          </div>

          <form onSubmit={handleConnect} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-[#6b7280] mb-1.5">Telegram ID *</label>
              <input
                value={telegramId}
                onChange={(e) => setTelegramId(e.target.value)}
                type="number"
                placeholder="Contoh: 123456789"
                className="w-full border border-[#e5e7eb] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1] transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6b7280] mb-1.5">Username Telegram (opsional)</label>
              <input
                value={telegramUsername}
                onChange={(e) => setTelegramUsername(e.target.value)}
                placeholder="Contoh: mahasiswa123"
                className="w-full border border-[#e5e7eb] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1] transition-all"
              />
            </div>
            {error && <p className="text-xs text-[#ef4444] bg-[#fef2f2] px-3 py-2 rounded-lg">{error}</p>}
            {success && <p className="text-xs text-[#16a34a] bg-[#f0fdf4] px-3 py-2 rounded-lg">{success}</p>}
            <button
              type="submit"
              disabled={isPending || !telegramId.trim()}
              className="w-full py-2.5 text-sm font-semibold text-white bg-[#3b82f6] hover:bg-[#2563eb] rounded-xl transition-colors disabled:opacity-50"
            >
              {isPending ? "Menghubungkan..." : "Hubungkan Telegram"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
