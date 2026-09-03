"use client";

import { Button, EmptyState } from "@/components/ui";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-5 px-5 py-12">
      <EmptyState
        title="Something went wrong on my side"
        description="Not you. Try that again, and if it keeps happening message me and I will sort it."
        action={<Button onClick={reset}>Try again</Button>}
      />
    </main>
  );
}
