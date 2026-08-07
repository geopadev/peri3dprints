"use client";

import Link from "next/link";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui";
import { FOCUS_RING } from "@/components/ui/focus-ring";
import { cn } from "@/lib/cn";

export type AccountMenuProps = {
  displayName: string | null;
  signOutAction: () => void | Promise<void>;
};

const ITEM =
  "flex min-h-11 items-center border-t-2 border-ink px-4 font-mono text-xs tracking-utility uppercase";

/**
 * The signed in account links, behind one icon.
 *
 * They used to sit inline in the bar: display name, Orders, Messages, Sign
 * out, four items competing with the logo, search and cart. Collapsing them
 * keeps the header to four controls at every width, and means adding a fifth
 * account link later costs nothing in the bar.
 *
 * Below sm this is hidden and the same links live in the drawer, so a phone
 * never shows two ways into the same place.
 */
export function AccountMenu({ displayName, signOutAction }: AccountMenuProps) {
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
          <Link href="/messages" onClick={close} className={cn(ITEM, FOCUS_RING)}>
            Messages
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

function PersonIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="6.5" r="3.5" stroke="currentColor" strokeWidth="2" />
      <path
        d="M3.5 17c0-3.3 2.9-5.5 6.5-5.5s6.5 2.2 6.5 5.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
      />
    </svg>
  );
}
