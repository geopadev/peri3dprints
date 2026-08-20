import { EmptyState } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { ProductCardData } from "@/lib/products";
import { ProductCard } from "./product-card";

export type ProductGridProps = {
  products: ProductCardData[];
  /** Rendered as the first cell of the grid, not floated over it. Used by the
   * home page to sit the shop name among the stock rather than on top of it. */
  lead?: React.ReactNode;
  emptyTitle?: string;
  /** The empty state has to offer something to press, per section 4. The grid
   *  does not assume what: the home page and a filtered shop want different
   *  things, and two identical buttons a few pixels apart is worse than one. */
  emptyAction?: React.ReactNode;
  emptyDescription?: string;
  className?: string;
};

/** Every ~5th card runs taller, so the grid reads as a table of objects
 * rather than a spreadsheet. Rows still align at the top: shorter cards in a
 * row simply leave quiet space below them instead of stretching to match. */
function isTall(index: number): boolean {
  return index % 5 === 2;
}

export function ProductGrid({
  products,
  lead,
  emptyAction,
  emptyTitle = "Nothing here yet",
  emptyDescription = "Message me and I'll print what you want.",
  className,
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        {lead}
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          tone="invite"
          action={emptyAction}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-2 items-start gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4",
        className,
      )}
    >
      {lead}
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          tall={isTall(index)}
          fadeDelayMs={(index % 12) * 40}
        />
      ))}
    </div>
  );
}
