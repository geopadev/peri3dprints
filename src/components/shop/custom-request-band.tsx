import Link from "next/link";
import { Button } from "@/components/ui";

/**
 * Quiet on purpose: no flame, no second flourish competing with the spec
 * strip. /custom itself is stage 12's build, so this links ahead of it.
 */
export function CustomRequestBand() {
  return (
    <section className="border-t-2 border-ink bg-surface px-5 py-10 text-center">
      <div className="mx-auto flex max-w-xl flex-col items-center gap-3">
        <h2 className="text-xl">Want something that is not on the shelf</h2>
        <p>Tell me what you have in mind and I will tell you if I can print it.</p>
        <Link href="/custom">
          <Button variant="secondary">Ask for a custom print</Button>
        </Link>
      </div>
    </section>
  );
}
