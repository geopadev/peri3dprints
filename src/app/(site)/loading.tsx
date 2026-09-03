import { Skeleton } from "@/components/ui";

export default function SiteLoading() {
  return (
    <main className="px-5 py-6">
      <Skeleton className="mb-5 h-40 w-full" />
      <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[3/4] w-full" />
        ))}
      </div>
    </main>
  );
}
