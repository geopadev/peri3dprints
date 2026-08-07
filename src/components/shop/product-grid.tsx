import { EmptyState } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { ProductCardData } from "@/lib/products";
import { ProductCard } from "./product-card";

export type ProductGridProps = {
  products: ProductCardData[];
  emptyTitle?: string;
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
  emptyTitle = "Nothing here yet",
  emptyDescription = "Message me and I'll print what you want.",
  className,
}: ProductGridProps) {
  if (products.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className={cn("grid grid-cols-2 items-start gap-4 sm:gap-5 lg:grid-cols-4", className)}>
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
