import { cn } from "@/lib/cn";

/**
 * No flame tone on purpose: CLAUDE.md section 3 gives flame to the primary
 * button and nothing else.
 */
export type TagTone = "neutral" | "stock" | "sale" | "info";

export type TagProps = React.ComponentPropsWithRef<"span"> & {
  tone?: TagTone;
};

const TONE: Record<TagTone, string> = {
  neutral: "bg-surface text-ink",
  stock: "bg-lime text-ink",
  sale: "bg-magenta text-ink",
  info: "bg-cyan text-ink",
};

export function Tag({ tone = "neutral", className, ...props }: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill border-2 border-ink px-3 py-1",
        "font-mono text-xs tracking-utility uppercase",
        TONE[tone],
        className,
      )}
      {...props}
    />
  );
}
