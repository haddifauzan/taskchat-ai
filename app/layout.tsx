import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import TopLoader from "@/components/TopLoader";
import { Suspense } from "react";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://taskchat-ai.vercel.app"),
  title: "TaskChat AI — Cukup Chat, Tugas Langsung Tercatat",
  description:
    "Aplikasi pencatatan tugas berbasis AI untuk mahasiswa. Kirim pesan ke bot Telegram, tugas otomatis tersimpan.",
  icons: {
    icon: "/assets/taskchat-ai-logo.png",
    shortcut: "/assets/taskchat-ai-logo.png",
    apple: "/assets/taskchat-ai-logo.png",
  },
  openGraph: {
    title: "TaskChat AI — Cukup Chat, Tugas Langsung Tercatat",
    description:
      "Aplikasi pencatatan tugas berbasis AI untuk mahasiswa. Kirim pesan ke bot Telegram, tugas otomatis tersimpan.",
    url: "https://taskchat-ai.vercel.app",
    siteName: "TaskChat AI",
    images: [
      {
        url: "/assets/taskchat-thumbnail.png",
        width: 1200,
        height: 630,
        alt: "TaskChat AI Preview",
      },
    ],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TaskChat AI — Cukup Chat, Tugas Langsung Tercatat",
    description:
      "Aplikasi pencatatan tugas berbasis AI untuk mahasiswa. Kirim pesan ke bot Telegram, tugas otomatis tersimpan.",
    images: ["/assets/taskchat-thumbnail.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={inter.variable}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
          integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body className="min-h-screen antialiased">
        <ThemeProvider>
          <Suspense fallback={null}>
            <TopLoader />
          </Suspense>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
