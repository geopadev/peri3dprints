import Image from "next/image";
import Link from "next/link";
import { Money, SpecStrip } from "@/components/ui";
import { FOCUS_RING } from "@/components/ui/focus-ring";
import { cn } from "@/lib/cn";
import { productImageUrl } from "@/lib/product-image-url";
import type { ProductCardData } from "@/lib/products";

export type ProductCardProps = {
  product: ProductCardData;
  /** Staggered fade-up delay in ms, per CLAUDE.md section 3 motion rules. */
  fadeDelayMs?: number;
  /** Occasional taller image, so the grid reads as a table of objects rather
   * than a spreadsheet. See ProductGrid for the pattern that sets this. */
  tall?: boolean;
  className?: string;
};

/**
 * Cover image, title, price, one line of spec. Nothing else, per the brief:
 * this card appears dozens of times on one screen and has to stay quiet so
 * the spec strip is the thing people notice.
 */
export function ProductCard({ product, fadeDelayMs, tall, className }: ProductCardProps) {
  return (
    <Link
      href={`/product/${product.slug}`}
      style={fadeDelayMs !== undefined ? { animationDelay: `${fadeDelayMs}ms` } : undefined}
      className={cn(
        "group flex flex-col overflow-hidden rounded-card border-2 border-ink bg-surface",
        "shadow-hard transition-transform duration-[120ms] ease-press hover:-translate-y-[2px]",
        "motion-safe:animate-fade-up motion-safe:opacity-0",
        FOCUS_RING,
        className,
      )}
    >
      {/* Square on a phone, where two ragged columns read as a mistake rather
          than as a market table. The height variation only starts once there
          is enough width for it to look deliberate. */}
      <div className={cn("relative aspect-square w-full bg-paper", tall && "sm:aspect-[3/4]")}>
        {product.cover ? (
          <Image
            src={productImageUrl(product.cover.storagePath, 480)}
            alt={product.cover.altText}
            fill
            sizes="(min-width: 1024px) 25vw, 50vw"
            className="object-cover"
          />
        ) : (
          <span className="flex h-full items-center justify-center font-mono text-xs tracking-utility text-ink-soft uppercase">
            No photo
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="truncate font-semibold">{product.title}</h3>
        <Money cents={product.priceCents} className="text-lg" />
        <SpecStrip
          material={product.spec.material ?? undefined}
          dimensionsMm={product.spec.dimensionsMm ?? undefined}
          weightGrams={product.spec.weightGrams ?? undefined}
          printMinutes={product.spec.printMinutes ?? undefined}
          note={product.spec.note ?? undefined}
          className="flex-nowrap overflow-hidden text-ellipsis whitespace-nowrap"
        />
      </div>
    </Link>
  );
}
