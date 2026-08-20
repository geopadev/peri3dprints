"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import Link from "next/link";
import { useState } from "react";
import { Dialog, DialogClose, DialogTrigger, UTILITY_TEXT } from "@/components/ui";
import { FOCUS_RING } from "@/components/ui/focus-ring";
import { cn } from "@/lib/cn";

export type SiteMenuProps = {
  categories: { slug: string; name: string }[];
};

const LINK = `flex min-h-12 items-center border-b-2 border-ink px-5 ${UTILITY_TEXT}`;

const SECTION = "px-5 pt-5 pb-2 font-mono text-xs tracking-utility text-ink-soft uppercase";

/**
 * The shop's navigation, and only the shop's: home, categories, custom
 * requests. Anything belonging to the person signed in lives under the account
 * icon on the right instead, so there is one place to look for each.
 *
 * A left-anchored drawer rather than the horizontally scrolling chip row this
 * replaced: a phone user should not have to swipe sideways to find out what
 * the shop sells.
 *
 * Radix handles the focus trap and escape key. No slide animation, because
 * CLAUDE.md section 3 names exactly three places motion lives and a drawer is
 * not one of them.
 */
export function SiteMenu({ categories }: SiteMenuProps) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="Menu"
          className={cn("flex h-11 w-11 shrink-0 items-center justify-center", FOCUS_RING)}
        >
          <MenuIcon />
        </button>
      </DialogTrigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-ink/50" />
        <DialogPrimitive.Content
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-[calc(100%-3rem)] max-w-xs flex-col",
            "overflow-y-auto border-r-2 border-ink bg-surface shadow-hard",
            FOCUS_RING,
          )}
        >
          <div className="flex items-center justify-between border-b-2 border-ink px-5 py-3">
            <DialogPrimitive.Title className="font-display text-lg font-extrabold tracking-display">
              Menu
            </DialogPrimitive.Title>
            <DialogClose
              aria-label="Close menu"
              className={cn(
                "flex h-11 w-11 items-center justify-center text-2xl leading-none",
                FOCUS_RING,
              )}
            >
              ×
            </DialogClose>
          </div>

          <nav className="flex flex-col">
            <Link href="/" onClick={close} className={cn(LINK, FOCUS_RING)}>
              Home
            </Link>
            <Link href="/shop" onClick={close} className={cn(LINK, FOCUS_RING)}>
              Everything
            </Link>

            {categories.length > 0 && (
              <>
                <p className={SECTION}>Categories</p>
                {categories.map((category) => (
                  <Link
                    key={category.slug}
                    href={`/shop/${category.slug}`}
                    onClick={close}
                    className={cn(LINK, FOCUS_RING)}
                  >
                    {category.name}
                  </Link>
                ))}
              </>
            )}

            <p className={SECTION}>Made to order</p>
            <Link href="/custom" onClick={close} className={cn(LINK, FOCUS_RING)}>
              Ask for a custom print
            </Link>
          </nav>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </Dialog>
  );
}

function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <path
        d="M3 6h16M3 11h16M3 16h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
      />
    </svg>
  );
}
