"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: <i className="fa-solid fa-chart-pie text-base w-5 text-center"></i>,
  },
  {
    href: "/tasks",
    label: "Tasks",
    icon: <i className="fa-solid fa-list-check text-base w-5 text-center"></i>,
  },
  {
    href: "/chat",
    label: "Chat with Bot",
    icon: <i className="fa-solid fa-robot text-base w-5 text-center"></i>,
  },
  {
    href: "/calendar",
    label: "Calendar",
    icon: <i className="fa-solid fa-calendar-days text-base w-5 text-center"></i>,
  },
  {
    href: "/courses",
    label: "Courses",
    icon: <i className="fa-solid fa-book text-base w-5 text-center"></i>,
  },
  {
    href: "/reminders",
    label: "Reminders",
    icon: <i className="fa-solid fa-bell text-base w-5 text-center"></i>,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: <i className="fa-solid fa-gear text-base w-5 text-center"></i>,
  },
];

interface SidebarProps {
  userName: string;
  userEmail: string;
  userAvatar?: string | null;
}

export default function Sidebar({ userName, userEmail, userAvatar }: SidebarProps) {
  const pathname = usePathname();

  const initials = userName
    ? userName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  return (
    <aside className="w-[220px] shrink-0 flex flex-col h-screen sticky top-0 bg-white border-r border-[#f0eef8]">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[#f0eef8]">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/taskchat-ai-logo.png"
            alt="TaskChat AI Logo"
            className="w-9 h-9 object-contain"
          />
          <div>
            <p className="text-sm font-extrabold text-[#6366f1] leading-none">TaskChat AI</p>
            <p className="text-[9px] text-[#9ca3af] mt-1 font-medium">Academic Assistant</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-[#6366f1] text-white shadow-md shadow-[#6366f1]/20 font-semibold"
                  : "text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#1a1a2e]"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User profile */}
      <div className="px-3 py-4 border-t border-[#f0eef8]">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-[#f3f4f6] transition-colors cursor-pointer group">
          {userAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={userAvatar} alt={userName} className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#6366f1] flex items-center justify-center text-white text-xs font-bold">
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[#1a1a2e] truncate">Halo, {userName || "Pengguna"}!</p>
            <p className="text-[10px] text-[#9ca3af] truncate">{userEmail}</p>
          </div>
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              title="Sign out"
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-[#fee2e2] text-[#9ca3af] hover:text-[#ef4444]"
            >
              <i className="fa-solid fa-arrow-right-from-bracket text-xs w-4 h-4 flex items-center justify-center"></i>
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
