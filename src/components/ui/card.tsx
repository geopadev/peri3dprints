import { cn } from "@/lib/cn";

export type CardProps = React.ComponentPropsWithRef<"div"> & {
  /** Adds the 120ms hover lift. Only for cards that are themselves a link or button. */
  interactive?: boolean;
  padded?: boolean;
};

export function Card({ interactive = false, padded = true, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-card border-2 border-ink bg-surface shadow-hard",
        padded && "p-5",
        interactive && "transition-transform duration-[120ms] ease-press hover:-translate-y-[2px]",
        className,
      )}
      {...props}
    />
  );
}
