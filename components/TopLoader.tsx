"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function TopLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevPath = useRef(`${pathname}?${searchParams}`);

  useEffect(() => {
    const currentPath = `${pathname}?${searchParams}`;
    if (currentPath === prevPath.current) return;
    prevPath.current = currentPath;

    // Show bar
    setVisible(true);

    // Auto-hide after animation
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setVisible(false);
    }, 900);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pathname, searchParams]);

  if (!visible) return null;

  return <div className="top-loader" />;
}
