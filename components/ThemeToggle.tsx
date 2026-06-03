"use client";

import { useTheme } from "@/components/ThemeProvider";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
      className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200 cursor-pointer
        text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-border)] ${className}`}
    >
      {theme === "dark" ? (
        <i className="fa-solid fa-sun text-sm text-[#fbbf24]"></i>
      ) : (
        <i className="fa-solid fa-moon text-sm text-[#6366f1]"></i>
      )}
    </button>
  );
}
