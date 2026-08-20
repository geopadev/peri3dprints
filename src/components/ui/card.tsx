import { cn } from "@/lib/cn";

/**
 * One value, not a set of booleans, so a card carrying two competing accents is
 * not representable. That constraint is the whole defence against a grid that
 * looks like confetti.
 */
export type CardAccent = "none" | "action" | "info" | "highlight" | "offer";

const ACCENT: Record<CardAccent, string> = {
  none: "bg-surface",
  action: "bg-action",
  info: "bg-info",
  highlight: "bg-highlight",
  offer: "bg-offer",
};

export type CardProps = React.ComponentPropsWithRef<"div"> & {
  /** Adds the 120ms hover lift. Only for cards that are themselves a link or button. */
  interactive?: boolean;
  padded?: boolean;
  accent?: CardAccent;
};

export function Card({
  interactive = false,
  padded = true,
  accent = "none",
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        // Text stays ink on every accent: section 8 measured white against all
        // four and it fails every time.
        "rounded-card border-2 border-ink text-ink shadow-hard",
        ACCENT[accent],
        padded && "p-5",
        interactive && "transition-transform duration-[120ms] ease-press hover:-translate-y-[2px]",
        className,
      )}
      {...props}
    />
  );
}
