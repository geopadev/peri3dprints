"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/cn";
import { FOCUS_RING } from "./focus-ring";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export type DialogContentProps = React.ComponentPropsWithRef<typeof DialogPrimitive.Content>;

/**
 * Centred with inset + auto margins, deliberately not with a translate. The
 * reduced-motion block in globals.css sets `transform: none !important`
 * globally, which would otherwise throw the panel into the corner for exactly
 * the users least able to cope with it.
 *
 * Radix handles the focus trap and the escape key. Do not roll your own.
 * A DialogTitle is required for the accessible name.
 */
export function DialogContent({ className, children, ...props }: DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-ink/50" />
      <DialogPrimitive.Content
        className={cn(
          "fixed inset-0 z-50 m-auto h-fit w-[calc(100%-2rem)] max-w-lg",
          "max-h-[calc(100dvh-2rem)] overflow-y-auto",
          "rounded-card border-2 border-ink bg-surface p-6 shadow-hard",
          FOCUS_RING,
          className,
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogTitle({
  className,
  ...props
}: React.ComponentPropsWithRef<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className={cn("text-xl", className)} {...props} />;
}

export function DialogDescription({
  className,
  ...props
}: React.ComponentPropsWithRef<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description className={cn("mt-2 text-base text-ink", className)} {...props} />
  );
}

export function DialogFooter({ className, ...props }: React.ComponentPropsWithRef<"div">) {
  return <div className={cn("mt-6 flex flex-wrap justify-end gap-3", className)} {...props} />;
}
