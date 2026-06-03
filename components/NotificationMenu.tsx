"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface NotificationItem {
  id: string;
  reminder_type: "h-7" | "h-3" | "h-1" | "h-0";
  sent_at: string;
  created_at: string;
  assignment: {
    id: string;
    title: string;
    deadline: string | null;
    status: string;
    courses?: {
      id: string;
      name: string;
      color: string;
    } | null;
  };
}

export default function NotificationMenu() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hasNew, setHasNew] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);

        // Check for new notifications
        if (data.length > 0) {
          const lastRead = localStorage.getItem("last_read_notifications_time");
          const latestSent = new Date(data[0].sent_at || data[0].created_at).getTime();
          if (!lastRead || latestSent > parseInt(lastRead, 10)) {
            setHasNew(true);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Poll every 30 seconds to get fresh notifications
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen && notifications.length > 0) {
      // Mark as read locally
      const latestSent = new Date(notifications[0].sent_at || notifications[0].created_at).getTime();
      localStorage.setItem("last_read_notifications_time", latestSent.toString());
      setHasNew(false);
    }
  };

  const handleNotificationClick = (taskId: string) => {
    setIsOpen(false);
    router.push(`/tasks?id=${taskId}`);
  };

  const getReminderLabel = (type: string) => {
    switch (type) {
      case "h-7":
        return { text: "Pengingat H-7", cls: "text-[#6366f1] bg-[#eef2ff] dark:bg-[#1e1b4b] dark:text-[#a5b4fc]" };
      case "h-3":
        return { text: "Pengingat H-3", cls: "text-[#f59e0b] bg-[#fffbeb] dark:bg-[#1c1500] dark:text-[#fbbf24]" };
      case "h-1":
        return { text: "Peringatan H-1", cls: "text-[#ef4444] bg-[#fef2f2] dark:bg-[#1f0707] dark:text-[#f87171]" };
      case "h-0":
        return { text: "Deadline Hari Ini", cls: "text-[#ef4444] bg-[#fef2f2] dark:bg-[#1f0707] dark:text-[#f87171]" };
      default:
        return { text: "Pengingat Tugas", cls: "text-[#6b7280] bg-[#f3f4f6]" };
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Baru saja";
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    return `${diffDays} hari lalu`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleToggle}
        className={`w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-[var(--card)] border border-[#f0eef8] dark:border-[var(--card-border)] hover:bg-[#f8f7ff] dark:hover:bg-[var(--card-border)] text-[var(--muted)] hover:text-[var(--foreground)] transition-all cursor-pointer relative shadow-sm`}
        aria-label="Notifications"
      >
        <i className="fa-solid fa-bell text-base"></i>
        {hasNew && (
          <span className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-[var(--card)] animate-pulse" />
        )}
      </button>

      {/* Dropdown Modal */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[var(--card)] border border-[#f0eef8] dark:border-[var(--card-border)] rounded-2xl shadow-xl z-50 overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="px-4 py-3.5 border-b border-[#f0eef8] dark:border-[var(--card-border)] flex items-center justify-between">
            <span className="text-sm font-bold text-[#1a1a2e] dark:text-white">Notifikasi</span>
            {notifications.length > 0 && (
              <span className="text-[10px] font-semibold px-2 py-0.5 bg-[#eef2ff] dark:bg-[#1e1b4b] text-[#6366f1] dark:text-[#a5b4fc] rounded-full">
                {notifications.length} Info
              </span>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-[#f0eef8]/50 dark:divide-[var(--card-border)]/50">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-zinc-400 dark:text-zinc-500">
                <i className="fa-solid fa-bell-slash text-2xl mb-2 block"></i>
                <p className="text-xs">Tidak ada notifikasi baru.</p>
              </div>
            ) : (
              notifications.map((n) => {
                const label = getReminderLabel(n.reminder_type);
                const courseColor = n.assignment.courses?.color || "#6366f1";
                const isCompleted = n.assignment.status === "completed";

                return (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n.assignment.id)}
                    className="p-4 hover:bg-[#f8f7ff] dark:hover:bg-[var(--card-border)] transition-colors cursor-pointer flex gap-3 items-start"
                  >
                    {/* Course Color dot indicator */}
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0 mt-1.5"
                      style={{ backgroundColor: courseColor }}
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${label.cls}`}>
                          {label.text}
                        </span>
                        <span className="text-[9.5px] text-[#9ca3af]">
                          {formatRelativeTime(n.sent_at || n.created_at)}
                        </span>
                      </div>
                      
                      <p className={`text-xs font-semibold text-[#1a1a2e] dark:text-white truncate ${isCompleted ? "line-through text-[#9ca3af] dark:text-[#9ca3af]" : ""}`}>
                        {n.assignment.title}
                      </p>
                      
                      <p className="text-[10px] text-[#9ca3af] mt-0.5 truncate">
                        {n.assignment.courses?.name || "Tanpa Mata Kuliah"}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 bg-[#f8f7ff] dark:bg-[var(--card-border)]/20 border-t border-[#f0eef8] dark:border-[var(--card-border)] text-center">
            <button
              onClick={() => {
                setIsOpen(false);
                router.push("/reminders");
              }}
              className="text-[10px] font-semibold text-[#6366f1] dark:text-[#818cf8] hover:underline"
            >
              Lihat Semua Pengingat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
