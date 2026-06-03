/**
 * Date and Time utilities for Asia/Jakarta timezone
 */

export function formatDeadlineForDb(deadline?: string | null): string | null {
  if (!deadline) return null;
  // If the deadline already contains timezone information (e.g. 'Z' or '+07:00' or '-05:00'), return it as-is
  if (deadline.endsWith("Z") || deadline.includes("+") || /-\d{2}:\d{2}$/.test(deadline)) {
    return deadline;
  }
  // Otherwise, it's a local datetime value (e.g. 'YYYY-MM-DDThh:mm'). Append the Asia/Jakarta offset (+07:00)
  return `${deadline}+07:00`;
}

export function toJakartaDateString(
  date: Date | string,
  locale: string = "id-ID",
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(locale, {
    timeZone: "Asia/Jakarta",
    ...options,
  });
}

export function toJakartaTimeString(
  date: Date | string,
  locale: string = "id-ID",
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString(locale, {
    timeZone: "Asia/Jakarta",
    ...options,
  });
}
