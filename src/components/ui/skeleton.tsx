import { cn } from "@/lib/cn";

export type SkeletonProps = React.ComponentPropsWithRef<"div">;

/**
 * Pulses on opacity rather than transform, so it degrades to a flat block under
 * prefers-reduced-motion instead of disappearing.
 */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-card bg-ink/10", className)}
      {...props}
    />
  );
}
