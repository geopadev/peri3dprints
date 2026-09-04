"use client";

import Link from "next/link";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger, UTILITY_TEXT } from "@/components/ui";
import { FOCUS_RING } from "@/components/ui/focus-ring";
import { cn } from "@/lib/cn";
import type { NotificationItem } from "@/lib/notifications";

/**
 * One bell for everything waiting: replies, and updates on an order. It does
 * not replace either inbox, it points at them, so the thing you click through
 * to is still the page that owns that conversation or order.
 *
 * Nothing is marked read here. Opening the thing itself is what clears it,
 * which is why the count can only ever go down by actually reading something.
 */
export function NotificationBell({ items }: { items: NotificationItem[] }) {
  const [open, setOpen] = useState(false);
  const count = items.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={count > 0 ? `Notifications, ${count} new` : "Notifications, nothing new"}
          className={cn("relative flex h-11 w-11 shrink-0 items-center justify-center", FOCUS_RING)}
        >
          <BellIcon />
          {count > 0 && (
            <span
              aria-hidden="true"
              className={cn(
                "absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-pill border-2 border-ink px-1",
                "bg-offer font-mono text-[10px] leading-none text-ink",
              )}
            >
              {count > 9 ? "9+" : count}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-80 max-w-[calc(100vw-2rem)]">
        <p className={cn(UTILITY_TEXT, "border-b-2 border-ink px-4 py-3 text-ink")}>
          {count > 0 ? `${count} new` : "Nothing new"}
        </p>

        {count === 0 ? (
          <p className="px-4 py-4 text-sm">Replies and order updates show up here.</p>
        ) : (
          <ul className="flex max-h-80 flex-col overflow-y-auto">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex flex-col gap-0.5 border-b-2 border-ink px-4 py-3 last:border-b-0",
                    FOCUS_RING,
                  )}
                >
                  <span className="font-semibold">{item.title}</span>
                  {item.detail && <span className="truncate text-sm">{item.detail}</span>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M5 8a5 5 0 0 1 10 0c0 4 1.5 5 1.5 5h-13S5 12 5 8Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M8 16a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
    </svg>
  );
}
