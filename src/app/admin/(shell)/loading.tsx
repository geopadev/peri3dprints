import { Skeleton } from "@/components/ui";

export default function AdminLoading() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-3 px-5 py-8">
      <Skeleton className="h-9 w-40" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </main>
  );
}
