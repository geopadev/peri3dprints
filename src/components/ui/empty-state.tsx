import { cn } from "@/lib/cn";

/**
 * Empty states invite an action, they never just report emptiness.
 * "Nothing here yet. Message me and I'll print what you want."
 */
export type EmptyStateProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 rounded-card border-2 border-dashed border-ink bg-surface px-6 py-12 text-center",
        className,
      )}
    >
      <h2 className="text-xl">{title}</h2>
      {description && <p className="max-w-prose text-base text-ink">{description}</p>}
      {action}
    </div>
  );
}
