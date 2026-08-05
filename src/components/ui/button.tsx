import { cn } from "@/lib/cn";
import { FOCUS_RING } from "./focus-ring";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = React.ComponentPropsWithRef<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const VARIANT: Record<ButtonVariant, string> = {
  // flame owns the primary button and nothing else.
  primary: "border-ink bg-flame text-ink shadow-hard",
  secondary: "border-ink bg-surface text-ink shadow-hard",
  ghost: "border-transparent bg-transparent text-ink hover:bg-ink/5",
  // The palette has no destructive red, so magenta stands in. See the report.
  danger: "border-ink bg-magenta text-ink shadow-hard",
};

// Every size clears the 44px tap target floor from section 8.
const SIZE: Record<ButtonSize, string> = {
  sm: "h-11 px-4 text-sm",
  md: "h-12 px-5 text-base",
  lg: "h-14 px-7 text-lg",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-card border-2 font-semibold",
        "transition-[box-shadow,transform] duration-[120ms] ease-press",
        // The press: shadow collapses and the button moves into it.
        "active:translate-x-[2px] active:translate-y-[2px] active:shadow-hard-sm",
        "disabled:pointer-events-none disabled:opacity-50",
        VARIANT[variant],
        SIZE[size],
        FOCUS_RING,
        className,
      )}
      {...props}
    />
  );
}
