import { cn } from "@/lib/cn";

/**
 * Empty states invite an action, they never just report emptiness.
 * "Nothing here yet. Message me and I'll print what you want."
 */
export type EmptyStateTone = "plain" | "invite";

export type EmptyStateProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  /** A quiet wash, so an empty shop still looks like somewhere to be. */
  tone?: EmptyStateTone;
  className?: string;
};

export function EmptyState({
  title,
  description,
  action,
  tone = "plain",
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 rounded-card border-2 border-dashed border-ink px-6 py-12 text-center",
        tone === "invite" ? "bg-action-wash" : "bg-surface",
        className,
      )}
    >
      <h2 className="text-xl">{title}</h2>
      {description && <p className="max-w-prose text-base text-ink">{description}</p>}
      {action}
    </div>
  );
}
