import { SkeletonBox, SkeletonHeader, SkeletonSettingsCard } from "@/components/Skeleton";

export default function SettingsLoading() {
  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <SkeletonHeader />
      <main className="flex-1 px-8 py-6 max-w-2xl space-y-6">
        <SkeletonSettingsCard />
        {/* Telegram card */}
        <div className="card p-6 space-y-4">
          <SkeletonBox className="h-4 w-32" />
          <SkeletonBox className="h-20 w-full rounded-xl" />
        </div>
        {/* Sign out card */}
        <div className="card p-6 space-y-4">
          <SkeletonBox className="h-4 w-24" />
          <SkeletonBox className="h-3 w-2/3" />
          <SkeletonBox className="h-9 w-32 rounded-xl" />
        </div>
      </main>
    </div>
  );
}
