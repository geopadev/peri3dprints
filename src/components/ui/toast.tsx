"use client";

import * as ToastPrimitive from "@radix-ui/react-toast";
import { cn } from "@/lib/cn";
import { FOCUS_RING } from "./focus-ring";

export const ToastProvider = ToastPrimitive.Provider;
export const ToastAction = ToastPrimitive.Action;

export type ToastTone = "neutral" | "success" | "problem";

const TONE: Record<ToastTone, string> = {
  neutral: "bg-surface",
  success: "bg-lime",
  problem: "bg-magenta",
};

export function ToastViewport({
  className,
  ...props
}: React.ComponentPropsWithRef<typeof ToastPrimitive.Viewport>) {
  return (
    <ToastPrimitive.Viewport
      className={cn(
        "fixed right-0 bottom-0 z-50 flex w-full max-w-[420px] flex-col gap-3 p-4 outline-none",
        className,
      )}
      {...props}
    />
  );
}

export type ToastProps = React.ComponentPropsWithRef<typeof ToastPrimitive.Root> & {
  tone?: ToastTone;
};

export function Toast({ tone = "neutral", className, ...props }: ToastProps) {
  return (
    <ToastPrimitive.Root
      className={cn("rounded-card border-2 border-ink p-4 shadow-hard", TONE[tone], className)}
      {...props}
    />
  );
}

export function ToastTitle({
  className,
  ...props
}: React.ComponentPropsWithRef<typeof ToastPrimitive.Title>) {
  return <ToastPrimitive.Title className={cn("font-semibold text-ink", className)} {...props} />;
}

export function ToastDescription({
  className,
  ...props
}: React.ComponentPropsWithRef<typeof ToastPrimitive.Description>) {
  return (
    <ToastPrimitive.Description className={cn("mt-1 text-sm text-ink", className)} {...props} />
  );
}

export function ToastClose({
  className,
  ...props
}: React.ComponentPropsWithRef<typeof ToastPrimitive.Close>) {
  return (
    <ToastPrimitive.Close
      className={cn(
        "absolute top-2 right-2 flex h-11 w-11 cursor-pointer items-center justify-center rounded-pill text-ink",
        FOCUS_RING,
        className,
      )}
      aria-label="Close"
      {...props}
    />
  );
}
