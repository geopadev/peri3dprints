"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { FOCUS_RING } from "@/components/ui/focus-ring";
import { UTILITY_TEXT } from "@/components/ui/type";
import { NotificationBell } from "@/components/shop/notification-bell";
import type { NotificationItem } from "@/lib/notifications";

const LINKS = [
  { href: "/admin", label: "Today" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/products", label: "Prints" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/messages", label: "Messages" },
  { href: "/admin/people", label: "People" },
  { href: "/admin/settings", label: "Settings" },
] as const;

/**
 * Sticks to the bottom on a phone, because that is where a thumb is when he is
 * holding it one handed behind a market table. Moves to the top on wider screens.
 */
export function AdminNav({ notifications = [] }: { notifications?: NotificationItem[] }) {
  const pathname = usePathname();
  const unreadMessages = notifications.filter((n) => n.kind === "message").length;

  return (
    <nav
      aria-label="Admin"
      className="sticky bottom-0 z-30 order-last flex items-center border-t-2 border-ink bg-surface sm:top-0 sm:bottom-auto sm:order-first sm:border-t-0 sm:border-b-2"
    >
      {/* Scrolls sideways rather than squeezing. Six equal flex items ran
          "Settings" off the edge of a 390px phone, which silently loses him a
          whole section on exactly the device this nav is built for. Items keep
          their own width and the row scrolls if it has to. */}
      <ul className="flex min-w-0 flex-1 overflow-x-auto">
        {LINKS.map((link) => {
          const active =
            link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);

          return (
            <li key={link.href} className="flex-1 shrink-0">
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  `flex min-h-[56px] items-center justify-center px-3 text-center whitespace-nowrap ${UTILITY_TEXT}`,
                  active ? "bg-ink text-paper" : "text-ink",
                  FOCUS_RING,
                )}
              >
                {link.label}
                {link.href === "/admin/messages" && unreadMessages > 0 && (
                  <span className="ml-2 flex h-5 min-w-5 items-center justify-center rounded-pill border-2 border-ink bg-offer px-1 font-mono text-[10px] leading-none text-ink">
                    {unreadMessages > 9 ? "9+" : unreadMessages}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="flex shrink-0 items-center border-l-2 border-ink pl-1">
        <NotificationBell items={notifications} />
      </div>
    </nav>
  );
}
