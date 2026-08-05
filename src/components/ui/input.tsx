import { cn } from "@/lib/cn";
import { FOCUS_RING } from "./focus-ring";

export type InputProps = React.ComponentPropsWithRef<"input"> & {
  invalid?: boolean;
};

export const CONTROL_BASE =
  "w-full rounded-card border-2 bg-surface px-4 text-base text-ink placeholder:text-ink-soft disabled:opacity-50 disabled:cursor-not-allowed";

export function Input({ invalid = false, className, ...props }: InputProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(
        CONTROL_BASE,
        "h-12",
        invalid ? "border-magenta" : "border-ink",
        FOCUS_RING,
        className,
      )}
      {...props}
    />
  );
}
