"use client";

import { useState, useCallback } from "react";
import Sidebar from "@/components/sidebar/Sidebar";
import ThemeToggle from "@/components/ThemeToggle";

interface DashboardShellProps {
  children: React.ReactNode;
  userName: string;
  userEmail: string;
  userAvatar?: string | null;
}

export default function DashboardShell({
  children,
  userName,
  userEmail,
  userAvatar,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      <Sidebar
        userName={userName}
        userEmail={userEmail}
        userAvatar={userAvatar}
        isOpen={sidebarOpen}
        onClose={closeSidebar}
      />

      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile top bar with burger button */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-[var(--muted)] hover:bg-[var(--card-border)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
            aria-label="Open sidebar"
          >
            <i className="fa-solid fa-bars text-base"></i>
          </button>

          {/* Mobile logo center */}
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/taskchat-ai-logo.png"
              alt="TaskChat AI"
              className="w-7 h-7 object-contain"
            />
            <span className="text-sm font-extrabold text-[var(--primary)]">TaskChat AI</span>
          </div>

          <ThemeToggle />
        </div>

        {/* Page content */}
        {children}
      </div>
    </div>
  );
}
