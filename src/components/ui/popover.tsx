"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "@/lib/cn";
import { FOCUS_RING } from "./focus-ring";

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverClose = PopoverPrimitive.Close;

export type PopoverContentProps = React.ComponentPropsWithRef<typeof PopoverPrimitive.Content>;

/**
 * Same shell as DialogContent: 2px ink border, hard shadow, card radius. No
 * entry animation, because CLAUDE.md section 3 names the three places motion
 * is allowed and a popover is not one of them.
 *
 * Radix gives us escape-to-close, outside-click and focus return. Do not
 * rebuild any of that by hand.
 */
export function PopoverContent({
  className,
  align = "end",
  sideOffset = 8,
  ...props
}: PopoverContentProps) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 overflow-hidden rounded-card border-2 border-ink bg-surface shadow-hard",
          FOCUS_RING,
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}
