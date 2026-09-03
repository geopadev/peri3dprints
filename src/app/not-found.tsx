import Link from "next/link";
import { Button, EmptyState } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-5 px-5 py-12">
      <EmptyState
        tone="invite"
        title="That page is not here"
        description="It may have been taken off the shelf. The shop is still open."
        action={
          <Link href="/shop">
            <Button>Back to the shop</Button>
          </Link>
        }
      />
    </main>
  );
}
