"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { FOCUS_RING } from "@/components/ui/focus-ring";
import { cn } from "@/lib/cn";
import { Dialog, DialogClose, DialogTrigger } from "@/components/ui";
import { CartContents } from "./cart-contents";

/**
 * A right-anchored slide-over rather than the centred DialogContent the rest
 * of the app uses, so it needs its own Content rather than reusing that one.
 * No open/close animation: CLAUDE.md section 3 names exactly three places
 * motion lives, and a panel slide is not one of them.
 */
export function CartPanel({
  whatsappNumber,
  trigger,
}: {
  whatsappNumber: string | null;
  trigger: React.ReactNode;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-ink/50" />
        <DialogPrimitive.Content
          className={cn(
            "fixed inset-y-0 right-0 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col",
            "border-l-2 border-ink bg-surface shadow-hard",
            FOCUS_RING,
          )}
        >
          <div className="flex items-center justify-between border-b-2 border-ink p-4">
            <DialogPrimitive.Title className="text-xl">Your cart</DialogPrimitive.Title>
            <DialogClose
              aria-label="Close cart"
              className={cn(
                "flex h-11 w-11 items-center justify-center text-2xl leading-none",
                FOCUS_RING,
              )}
            >
              ×
            </DialogClose>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <CartContents whatsappNumber={whatsappNumber} />
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </Dialog>
  );
}
