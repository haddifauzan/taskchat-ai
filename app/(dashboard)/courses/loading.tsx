import { SkeletonBox, SkeletonHeader } from "@/components/Skeleton";

export default function CoursesLoading() {
  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <div className="px-8 py-6 border-b border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] flex items-center justify-between">
        <div className="space-y-2">
          <SkeletonBox className="h-6 w-28" />
          <SkeletonBox className="h-3 w-52" />
        </div>
        <SkeletonBox className="h-9 w-32 rounded-xl" />
      </div>
      <main className="flex-1 px-8 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-6 space-y-4">
              <div className="flex items-center gap-3">
                <SkeletonBox className="w-10 h-10 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <SkeletonBox className="h-4 w-3/4" />
                  <SkeletonBox className="h-3 w-1/2" />
                </div>
              </div>
              <SkeletonBox className="h-1.5 w-full rounded-full" />
              <div className="flex justify-between">
                <SkeletonBox className="h-5 w-20 rounded-full" />
                <SkeletonBox className="h-5 w-16 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
