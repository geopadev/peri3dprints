"use client";

import Link from "next/link";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger, UTILITY_TEXT } from "@/components/ui";
import { FOCUS_RING } from "@/components/ui/focus-ring";
import { cn } from "@/lib/cn";
import { PersonIcon } from "./person-icon";

export type AccountMenuProps = {
  displayName: string | null;
  signOutAction: () => void | Promise<void>;
  /** Unread conversations, shown against Messages so the count is where the
   *  thing it counts is. */
  unreadMessages?: number;
};

const ITEM = `flex min-h-11 items-center border-t-2 border-ink px-4 ${UTILITY_TEXT}`;

/**
 * The signed in account links, behind one icon.
 *
 * They used to sit inline in the bar: display name, Orders, Messages, Sign
 * out, four items competing with the logo, search and cart. Collapsing them
 * keeps the header to four controls at every width, and means adding a fifth
 * account link later costs nothing in the bar.
 *
 * Shown at every width, including on a phone. The drawer on the left is for
 * the shop: home, categories, custom requests. Anything to do with the person
 * signed in belongs on the right, under this icon, where they will look for it.
 */
export function AccountMenu({ displayName, signOutAction, unreadMessages = 0 }: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={displayName ? `Your account, ${displayName}` : "Your account"}
          className={cn("flex h-11 w-11 shrink-0 items-center justify-center", FOCUS_RING)}
        >
          <PersonIcon />
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-56">
        {displayName && (
          <p className="truncate px-4 py-3 font-mono text-xs tracking-utility text-ink-soft uppercase">
            {displayName}
          </p>
        )}

        <nav className="flex flex-col">
          <Link href="/account" onClick={close} className={cn(ITEM, FOCUS_RING)}>
            Account
          </Link>
          <Link href="/orders" onClick={close} className={cn(ITEM, FOCUS_RING)}>
            Orders
          </Link>
          <Link
            href="/messages"
            onClick={close}
            className={cn(ITEM, "justify-between gap-2", FOCUS_RING)}
          >
            Messages
            {unreadMessages > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-pill border-2 border-ink bg-offer px-1 font-mono text-[10px] leading-none text-ink">
                {unreadMessages > 9 ? "9+" : unreadMessages}
              </span>
            )}
          </Link>
          <form action={signOutAction}>
            <button type="submit" className={cn(ITEM, "w-full cursor-pointer", FOCUS_RING)}>
              Sign out
            </button>
          </form>
        </nav>
      </PopoverContent>
    </Popover>
  );
}
