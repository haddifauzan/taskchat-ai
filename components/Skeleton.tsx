/** Reusable skeleton building blocks with shimmer animation */

// Single animated skeleton box
export function SkeletonBox({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

// Skeleton for a stat card (icon + number + label)
export function SkeletonStatCard() {
  return (
    <div className="card p-6 flex items-center gap-4">
      <SkeletonBox className="w-12 h-12 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <SkeletonBox className="h-3 w-16" />
        <SkeletonBox className="h-6 w-10" />
        <SkeletonBox className="h-2 w-24" />
      </div>
    </div>
  );
}

// Skeleton for a task/assignment list row
export function SkeletonTaskRow() {
  return (
    <div className="flex items-center gap-4 p-3 rounded-xl">
      <SkeletonBox className="w-10 h-10 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <SkeletonBox className="h-3 w-3/4" />
        <SkeletonBox className="h-2 w-1/3" />
      </div>
      <SkeletonBox className="h-5 w-16 rounded-full" />
    </div>
  );
}

// Skeleton for a card section with title + rows
export function SkeletonListCard({
  rows = 4,
  title = true,
}: {
  rows?: number;
  title?: boolean;
}) {
  return (
    <div className="card p-6 space-y-4">
      {title && <SkeletonBox className="h-4 w-40" />}
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <SkeletonTaskRow key={i} />
        ))}
      </div>
    </div>
  );
}

// Skeleton for page header
export function SkeletonHeader() {
  return (
    <div className="px-8 py-6 border-b border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] space-y-2">
      <SkeletonBox className="h-6 w-40" />
      <SkeletonBox className="h-3 w-60" />
    </div>
  );
}

// Skeleton calendar grid
export function SkeletonCalendar() {
  return (
    <div className="card p-6 space-y-4">
      {/* Month header */}
      <div className="flex justify-between items-center">
        <SkeletonBox className="h-5 w-36" />
        <div className="flex gap-2">
          <SkeletonBox className="w-8 h-8 rounded-lg" />
          <SkeletonBox className="w-8 h-8 rounded-lg" />
        </div>
      </div>
      {/* Day names */}
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <SkeletonBox key={i} className="h-4" />
        ))}
      </div>
      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, i) => (
          <SkeletonBox key={i} className="aspect-square rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// Skeleton for a settings section
export function SkeletonSettingsCard() {
  return (
    <div className="card p-6 space-y-4">
      <SkeletonBox className="h-4 w-28" />
      <div className="flex items-center gap-4">
        <SkeletonBox className="w-14 h-14 rounded-full flex-shrink-0" />
        <div className="space-y-2 flex-1">
          <SkeletonBox className="h-4 w-1/2" />
          <SkeletonBox className="h-3 w-2/3" />
        </div>
      </div>
    </div>
  );
}
