import { cn } from "@/lib/cn";
import { CONTROL_BASE } from "./input";
import { FOCUS_RING } from "./focus-ring";

/**
 * A native select, not the Radix one. The owner works one-handed on a phone in a
 * noisy market, and the OS picker beats anything we can draw for that.
 */
export type SelectProps = React.ComponentPropsWithRef<"select"> & {
  invalid?: boolean;
  wrapperClassName?: string;
};

export function Select({
  invalid = false,
  className,
  wrapperClassName,
  children,
  ...props
}: SelectProps) {
  return (
    <div className={cn("relative", wrapperClassName)}>
      <select
        aria-invalid={invalid || undefined}
        className={cn(
          CONTROL_BASE,
          "h-12 appearance-none pr-11",
          invalid ? "border-ink bg-alert-tint" : "border-ink bg-surface",
          FOCUS_RING,
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-4 flex items-center"
      >
        <svg width="14" height="9" viewBox="0 0 14 9" fill="none">
          <path d="M1 1L7 7L13 1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" />
        </svg>
      </span>
    </div>
  );
}
