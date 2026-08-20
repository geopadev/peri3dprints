import Link from "next/link";
import { FOCUS_RING } from "@/components/ui/focus-ring";
import { cn } from "@/lib/cn";
import { UTILITY_TEXT } from "@/components/ui/type";

export type PaginationProps = {
  page: number;
  pageCount: number;
  /** Builds the href for a given page, keeping whatever filters are set. */
  hrefForPage: (page: number) => string;
};

export function Pagination({ page, pageCount, hrefForPage }: PaginationProps) {
  if (pageCount <= 1) return null;

  return (
    <nav aria-label="Pages" className="flex items-center justify-center gap-3 py-8">
      <PageLink href={hrefForPage(page - 1)} disabled={page <= 1} aria-label="Previous page">
        Previous
      </PageLink>
      <span className={UTILITY_TEXT}>
        Page {page} of {pageCount}
      </span>
      <PageLink href={hrefForPage(page + 1)} disabled={page >= pageCount} aria-label="Next page">
        Next
      </PageLink>
    </nav>
  );
}

function PageLink({
  href,
  disabled,
  children,
  ...props
}: React.ComponentPropsWithoutRef<"a"> & { href: string; disabled: boolean }) {
  if (disabled) {
    return (
      <span
        aria-disabled="true"
        className="inline-flex min-h-11 items-center rounded-pill border-2 border-ink px-4 font-mono text-xs tracking-utility text-ink-soft uppercase opacity-50"
      >
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        `inline-flex min-h-11 items-center rounded-pill border-2 border-ink px-4 ${UTILITY_TEXT}`,
        FOCUS_RING,
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
