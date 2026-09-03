"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FOCUS_RING } from "@/components/ui/focus-ring";
import { cn } from "@/lib/cn";

/**
 * The floating message button, bottom right. It is a link to /messages, which
 * is where the sign in wall lives: a signed out visitor lands on
 * /sign-in?next=/messages and comes back to the open chat afterwards.
 *
 * Hidden on the chat pages themselves and in the admin, where it would sit on
 * top of the thing it opens.
 */
export function ChatLauncher() {
  const pathname = usePathname();
  if (pathname.startsWith("/messages") || pathname.startsWith("/admin")) return null;

  return (
    <Link
      href="/messages"
      aria-label="Message me"
      className={cn(
        "fixed right-4 bottom-4 z-30 flex h-14 items-center gap-2 rounded-pill border-2 border-ink bg-action px-5 font-semibold text-ink shadow-hard",
        "active:translate-x-[2px] active:translate-y-[2px] active:shadow-hard-sm",
        FOCUS_RING,
      )}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path
          d="M3 4h14v9H8l-4 3v-3H3z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
      Message me
    </Link>
  );
}
