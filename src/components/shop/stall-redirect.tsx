"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UTILITY_TEXT } from "@/components/ui/type";

/** Long enough for the analytics beacon to leave before the browser navigates
 *  away, short enough that nobody waiting on a market stall notices a pause. */
const REDIRECT_DELAY_MS = 150;

/**
 * The redirect happens here, client side, on a timer, rather than as a
 * server side redirect() in the page above. A server redirect answers with
 * a 3xx before this component, or the analytics script in the root layout,
 * ever gets to run in the browser: the visit would never be counted, which
 * defeats the only reason this route exists.
 */
export function StallRedirect() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => router.replace("/"), REDIRECT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-paper px-5 text-center">
      <p className="font-display text-2xl font-extrabold tracking-display">Peri 3D Prints</p>
      <p className={UTILITY_TEXT}>Opening the shop</p>
      {/* If script is blocked or slow, there is still a way in rather than a
          dead end: a plain link works with no JavaScript at all. */}
      {/* Link renders a real <a href="/">, so this still works with no
          JavaScript at all, which is exactly the case it exists for. */}
      <noscript>
        <Link href="/" className="font-semibold underline">
          Continue to the shop
        </Link>
      </noscript>
    </main>
  );
}
