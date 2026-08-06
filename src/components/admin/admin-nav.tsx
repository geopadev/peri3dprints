"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { FOCUS_RING } from "@/components/ui/focus-ring";

const LINKS = [
  { href: "/admin", label: "Today" },
  { href: "/admin/products", label: "Prints" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/settings", label: "Settings" },
] as const;

/**
 * Sticks to the bottom on a phone, because that is where a thumb is when he is
 * holding it one handed behind a market table. Moves to the top on wider screens.
 */
export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Admin"
      className="sticky bottom-0 z-30 order-last border-t-2 border-ink bg-surface sm:top-0 sm:bottom-auto sm:order-first sm:border-t-0 sm:border-b-2"
    >
      <ul className="mx-auto flex max-w-5xl">
        {LINKS.map((link) => {
          const active =
            link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);

          return (
            <li key={link.href} className="flex-1">
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-[56px] items-center justify-center px-2 text-center font-mono text-xs tracking-utility uppercase",
                  active ? "bg-ink text-paper" : "text-ink",
                  FOCUS_RING,
                )}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
