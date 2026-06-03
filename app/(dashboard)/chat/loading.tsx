import { SkeletonBox, SkeletonHeader } from "@/components/Skeleton";

export default function ChatLoading() {
  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <SkeletonHeader />
      <main className="flex-1 px-8 py-6 max-w-2xl">
        <div className="card p-8 space-y-6">
          <div className="flex flex-col items-center gap-4">
            <SkeletonBox className="w-20 h-20 rounded-2xl" />
            <SkeletonBox className="h-5 w-48" />
            <SkeletonBox className="h-3 w-72" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 rounded-xl border border-[var(--card-border)]">
                <SkeletonBox className="h-3 w-3/4 mb-2" />
                <SkeletonBox className="h-2.5 w-1/2" />
              </div>
            ))}
          </div>
          <SkeletonBox className="h-11 w-40 rounded-xl mx-auto" />
        </div>
      </main>
    </div>
  );
}
