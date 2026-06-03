"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import ThemeToggle from "@/components/ThemeToggle";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "fa-solid fa-chart-pie" },
  { href: "/tasks", label: "Tasks", icon: "fa-solid fa-list-check" },
  { href: "/chat", label: "Chat with Bot", icon: "fa-solid fa-robot" },
  { href: "/calendar", label: "Calendar", icon: "fa-solid fa-calendar-days" },
  { href: "/courses", label: "Courses", icon: "fa-solid fa-book" },
  { href: "/reminders", label: "Reminders", icon: "fa-solid fa-bell" },
  { href: "/settings", label: "Settings", icon: "fa-solid fa-gear" },
];

interface SidebarProps {
  userName: string;
  userEmail: string;
  userAvatar?: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ userName, userEmail, userAvatar, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const initials = userName
    ? userName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  // Close sidebar on route change (mobile)
  useEffect(() => {
    onClose();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  // Prevent body scroll when sidebar open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          lg:static lg:inset-auto lg:z-auto
          w-[240px] shrink-0 flex flex-col h-screen
          bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)]
          shadow-xl lg:shadow-none
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b border-[var(--sidebar-border)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/taskchat-ai-logo.png"
              alt="TaskChat AI Logo"
              className="w-9 h-9 object-contain flex-shrink-0"
            />
            <div>
              <p className="text-sm font-extrabold text-[var(--primary)] leading-none">TaskChat AI</p>
              <p className="text-[9px] text-[var(--muted-light)] mt-0.5 font-medium tracking-wide">Academic Assistant</p>
            </div>
          </div>
          {/* Close button (mobile only) */}
          <button
            onClick={onClose}
            className="lg:hidden w-7 h-7 flex items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--card-border)] transition-colors cursor-pointer"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? "bg-[var(--primary)] text-white shadow-md"
                    : "text-[var(--muted)] hover:bg-[var(--card-border)] hover:text-[var(--foreground)]"
                }`}
              >
                <i
                  className={`${item.icon} text-sm w-4 text-center transition-transform group-hover:scale-110 ${
                    isActive ? "text-white" : "text-[var(--primary)]"
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom: User + theme toggle */}
        <div className="px-3 py-4 border-t border-[var(--sidebar-border)] space-y-2">
          {/* Theme toggle */}
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-xs text-[var(--muted)] font-medium">Tampilan</span>
            <ThemeToggle />
          </div>

          {/* User info */}
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-[var(--card-border)] transition-colors group">
            {userAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={userAvatar} alt={userName} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[var(--foreground)] truncate">{userName || "Pengguna"}</p>
              <p className="text-[10px] text-[var(--muted-light)] truncate">{userEmail}</p>
            </div>
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                title="Sign out"
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-[var(--danger-bg)] text-[var(--muted-light)] hover:text-[var(--danger)] cursor-pointer"
              >
                <i className="fa-solid fa-arrow-right-from-bracket text-xs"></i>
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}
