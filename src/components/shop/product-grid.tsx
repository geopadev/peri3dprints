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
        // items-stretch, not items-start: with every image well the same
        // shape, cards in a row should end level too. A long title wrapping
        // to two lines otherwise leaves its neighbour short.
        "grid grid-cols-2 items-stretch gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4",
        className,
      )}
    >
      {lead}
      {products.map((product, index) => (
        <ProductCard key={product.id} product={product} fadeDelayMs={(index % 12) * 40} />
      ))}
    </div>
  );
}
