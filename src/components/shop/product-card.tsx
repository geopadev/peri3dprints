import Image from "next/image";
import Link from "next/link";
import { Money, SpecStrip, Tag } from "@/components/ui";
import { FOCUS_RING } from "@/components/ui/focus-ring";
import { cn } from "@/lib/cn";
import { productImageUrl } from "@/lib/product-image-url";
import type { ProductCardData } from "@/lib/products";

export type ProductCardProps = {
  product: ProductCardData;
  /** Staggered fade-up delay in ms, per CLAUDE.md section 3 motion rules. */
  fadeDelayMs?: number;
  className?: string;
};

/**
 * Cover image, title, price, one line of spec. Nothing else, per the brief:
 * this card appears dozens of times on one screen and has to stay quiet so
 * the spec strip is the thing people notice.
 */

/**
 * One badge, chosen by priority, never two. A card that shouts twice shouts
 * about nothing, and the spec strip has to stay the loudest thing here.
 */
function badgeFor(product: ProductCardData): { tone: "sale" | "stock"; label: string } | null {
  if (product.compareAtCents !== null) return { tone: "sale", label: "Sale" };
  if (!product.madeToOrder && (product.stockQty ?? 0) > 0) {
    return { tone: "stock", label: "In stock" };
  }
  return null;
}

export function ProductCard({ product, fadeDelayMs, className }: ProductCardProps) {
  const badge = badgeFor(product);

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
      {/* Square at every width. Every image well is the same shape, so the
          grid lines up in rows and the eye compares the prints rather than the
          boxes they sit in. */}
      <div className="relative aspect-square w-full bg-paper">
        {product.cover ? (
          <Image
            src={productImageUrl(product.cover.storagePath, 480)}
            alt={product.cover.altText}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
            className="object-cover"
          />
        ) : (
          <span className="flex h-full items-center justify-center font-mono text-xs tracking-utility text-ink uppercase">
            No photo
          </span>
        )}

        {/* Positioned with top and left, never a transform: the reduced motion
            block sets transform: none globally, so a translated badge would
            jump out of the corner for exactly the people least able to cope
            with it. The tilt is a transform and is allowed to be lost. */}
        {badge && (
          <span className="absolute top-2 left-2 rotate-[-3deg]">
            <Tag tone={badge.tone} size="sm">
              {badge.label}
            </Tag>
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
          wrap={false}
        />
      </div>
    </Link>
  );
}
