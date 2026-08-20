import { cn } from "@/lib/cn";
import { FOCUS_RING } from "./focus-ring";

export type InputProps = React.ComponentPropsWithRef<"input"> & {
  invalid?: boolean;
};

/**
 * No background here on purpose. cn() has no tailwind-merge, so a bg- class in
 * the base and another in the invalid branch would both ship and the winner
 * would be decided by CSS source order rather than by intent. Each state sets
 * its own background.
 */
export const CONTROL_BASE =
  "w-full rounded-card border-2 px-4 text-base text-ink placeholder:text-ink-soft disabled:opacity-50 disabled:cursor-not-allowed";

export function Input({ invalid = false, className, ...props }: InputProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(
        CONTROL_BASE,
        "h-12",
        // Invalid is an ink border on a faint pink field, not a magenta
        // border: magenta belongs to sale now. The tint carries the signal
        // because an ink border against an ink border is no signal at all,
        // and aria-invalid plus the error text carry it for everyone else.
        invalid ? "border-ink bg-alert-tint" : "border-ink bg-surface",
        FOCUS_RING,
        className,
      )}
      {...props}
    />
  );
}
