import { SkeletonBox, SkeletonHeader, SkeletonListCard } from "@/components/Skeleton";

export default function TasksLoading() {
  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <div className="px-8 py-6 border-b border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] flex items-center justify-between">
        <div className="space-y-2">
          <SkeletonBox className="h-6 w-24" />
          <SkeletonBox className="h-3 w-48" />
        </div>
        <SkeletonBox className="h-9 w-28 rounded-xl" />
      </div>
      <main className="flex-1 px-8 py-6 space-y-4">
        {/* Filter bar */}
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBox key={i} className="h-8 w-20 rounded-xl" />
          ))}
        </div>
        <SkeletonListCard rows={6} title={false} />
      </main>
    </div>
  );
}
