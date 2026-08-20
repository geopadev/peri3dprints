import { cn } from "@/lib/cn";
import { FOCUS_RING, FOCUS_RING_ON_ACCENT } from "./focus-ring";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "onAccent";
export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = React.ComponentPropsWithRef<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const VARIANT: Record<ButtonVariant, string> = {
  // flame owns the primary button and nothing else.
  primary: "border-ink bg-action text-ink shadow-hard active:shadow-hard-sm",
  secondary: "border-ink bg-surface text-ink shadow-hard active:shadow-hard-sm",
  ghost: "border-transparent bg-transparent text-ink hover:bg-ink/5",
  // The palette has no destructive red, so magenta stands in. A destructive
  // action is a deliberate loud choice, not an error report, which is why this
  // keeps magenta while invalid fields no longer do.
  danger: "border-ink bg-offer text-ink shadow-hard active:shadow-hard-sm",
  /*
    For a button sitting on a flame, cyan, lime or magenta band. Inverted rather
    than tinted, because on an accent only ink and paper are readable, and a
    flame button on a flame band is not a button. The shadow inverts too: an ink
    shadow on a coloured band disappears into the border.
  */
  onAccent: "border-ink bg-ink text-paper shadow-hard-inverse active:shadow-hard-inverse-sm",
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
        // The press: the button moves into its shadow. The shadow itself is
        // per variant, because onAccent inverts it and cn has no
        // tailwind-merge to resolve two competing shadow classes.
        "active:translate-x-[2px] active:translate-y-[2px]",
        "disabled:pointer-events-none disabled:opacity-50",
        VARIANT[variant],
        SIZE[size],
        // Chosen here, not by the caller: a cyan ring on a cyan band is
        // invisible, and getting that wrong is silent.
        variant === "onAccent" ? FOCUS_RING_ON_ACCENT : FOCUS_RING,
        className,
      )}
      {...props}
    />
  );
}
