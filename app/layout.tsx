import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "TaskChat AI — Cukup Chat, Tugas Langsung Tercatat",
  description:
    "Aplikasi pencatatan tugas berbasis AI untuk mahasiswa. Kirim pesan ke bot Telegram, tugas otomatis tersimpan.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={inter.variable}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
