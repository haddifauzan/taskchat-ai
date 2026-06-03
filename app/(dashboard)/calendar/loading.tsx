import { SkeletonBox, SkeletonCalendar, SkeletonListCard } from "@/components/Skeleton";

export default function CalendarLoading() {
  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <div className="px-8 py-6 border-b border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] space-y-2">
        <div className="flex items-center gap-2">
          <SkeletonBox className="w-5 h-5 rounded" />
          <SkeletonBox className="h-6 w-32" />
        </div>
        <SkeletonBox className="h-3 w-64" />
      </div>
      <main className="flex-1 px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Calendar */}
          <div className="lg:col-span-7">
            <SkeletonCalendar />
          </div>
          {/* Side panel */}
          <div className="lg:col-span-5 space-y-6">
            <SkeletonListCard rows={3} />
            <SkeletonListCard rows={4} />
          </div>
        </div>
      </main>
    </div>
  );
}
