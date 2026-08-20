import { cn } from "@/lib/cn";

export type NoticeTone = "problem" | "done" | "info";

/**
 * A short box that tells someone what happened. It replaces eleven hand rolled
 * bordered boxes that had drifted apart in colour and in markup.
 *
 * `problem` is an ink border on a faint pink field rather than a magenta
 * border. Magenta belongs to sale now, and a shop where the discount badge and
 * the declined card message are the same pink teaches people nothing. The
 * styleguide already said errors are ink; only the borders had drifted.
 */
const TONE: Record<NoticeTone, string> = {
  problem: "bg-alert-tint",
  done: "bg-highlight",
  info: "bg-info-wash",
};

export type NoticeProps = React.ComponentPropsWithRef<"div"> & {
  tone?: NoticeTone;
};

export function Notice({ tone = "problem", className, children, ...props }: NoticeProps) {
  return (
    <div
      className={cn("rounded-card border-2 border-ink p-3 text-ink", TONE[tone], className)}
      {...props}
    >
      {children}
    </div>
  );
}
