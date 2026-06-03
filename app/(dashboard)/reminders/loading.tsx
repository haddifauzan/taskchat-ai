import { SkeletonHeader, SkeletonListCard } from "@/components/Skeleton";

export default function RemindersLoading() {
  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <SkeletonHeader />
      <main className="flex-1 px-8 py-6 space-y-4">
        <SkeletonListCard rows={3} />
        <SkeletonListCard rows={2} />
        <SkeletonListCard rows={4} />
      </main>
    </div>
  );
}
