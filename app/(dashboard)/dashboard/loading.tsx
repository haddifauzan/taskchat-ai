import {
  SkeletonHeader,
  SkeletonStatCard,
  SkeletonListCard,
} from "@/components/Skeleton";

export default function DashboardLoading() {
  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <SkeletonHeader />
      <main className="flex-1 px-8 py-6 space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonStatCard key={i} />
          ))}
        </div>
        {/* Two section cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonListCard rows={4} />
          <SkeletonListCard rows={4} />
        </div>
      </main>
    </div>
  );
}
