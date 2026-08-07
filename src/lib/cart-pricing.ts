import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { CartLine } from "@/lib/cart-store";

export type PricedCartLine = {
  productId: string;
  variantId: string | null;
  slug: string;
  title: string;
  variantName: string | null;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
  weightGrams: number;
  cover: { storagePath: string; altText: string } | null;
  /** null means unlimited: the print is made to order, or has no stock count. */
  availableStock: number | null;
};

export type PricedCart = {
  lines: PricedCartLine[];
  /** Titles of lines that were dropped: archived, deleted, sold out, or
   * otherwise no longer buyable, so the buyer can be told what changed rather
   * than just seeing the cart shrink. */
  removed: { productId: string; variantId: string | null; title: string; reason: RemovalReason }[];
  /** Lines whose quantity was cut down to the stock actually available. */
  reduced: { title: string; requested: number; available: number }[];
  subtotalCents: number;
  totalWeightGrams: number;
};

export type RemovalReason = "unavailable" | "sold-out";

/**
 * Stock lives on the variant when there is one, and on the product otherwise.
 * A made-to-order print is never limited: he prints another.
 */
function availableStockFor(
  madeToOrder: boolean,
  productStock: number | null,
  variantStock: number | null,
  hasVariant: boolean,
): number | null {
  if (madeToOrder) return null;
  const stock = hasVariant ? variantStock : productStock;
  return stock ?? null;
}

/**
 * The only place cart prices come from. Every line is looked up fresh against
 * the database: anything archived, deleted or sold out is dropped, and a
 * quantity larger than the stock on hand is cut down to what is actually
 * there. Never trust either the price or the quantity the browser sent.
 */
export async function priceCartLines(cartLines: CartLine[]): Promise<PricedCart> {
  if (cartLines.length === 0) {
    return { lines: [], removed: [], reduced: [], subtotalCents: 0, totalWeightGrams: 0 };
  }

  const supabase = await createClient();
  const productIds = [...new Set(cartLines.map((line) => line.productId))];

  const { data: products } = await supabase
    .from("products")
    .select(
      "id, slug, title, status, price_cents, weight_grams, made_to_order, stock_qty, product_images(storage_path, alt_text, position), product_variants(id, name, price_delta_cents, stock_qty)",
    )
    .in("id", productIds);

  const productById = new Map((products ?? []).map((product) => [product.id, product]));

  const priced: PricedCartLine[] = [];
  const removed: PricedCart["removed"] = [];
  const reduced: PricedCart["reduced"] = [];

  for (const line of cartLines) {
    const product = productById.get(line.productId);

    if (!product || product.status !== "active") {
      removed.push({
        productId: line.productId,
        variantId: line.variantId,
        title: product?.title ?? "A print that used to be here",
        reason: "unavailable",
      });
      continue;
    }

    const variant = line.variantId
      ? (product.product_variants ?? []).find((candidate) => candidate.id === line.variantId)
      : null;

    if (line.variantId && !variant) {
      removed.push({
        productId: line.productId,
        variantId: line.variantId,
        title: product.title,
        reason: "unavailable",
      });
      continue;
    }

    const availableStock = availableStockFor(
      product.made_to_order ?? true,
      product.stock_qty,
      variant?.stock_qty ?? null,
      Boolean(variant),
    );

    if (availableStock !== null && availableStock <= 0) {
      removed.push({
        productId: line.productId,
        variantId: line.variantId,
        title: product.title,
        reason: "sold-out",
      });
      continue;
    }

    // Clamp rather than reject: the buyer keeps what they can actually have,
    // and gets told the rest is not available.
    const quantity =
      availableStock === null ? line.quantity : Math.min(line.quantity, availableStock);

    if (quantity < line.quantity) {
      reduced.push({
        title: product.title,
        requested: line.quantity,
        available: quantity,
      });
    }

    const cover = [...(product.product_images ?? [])].sort(
      (a, b) => (a.position ?? 0) - (b.position ?? 0),
    )[0];

    const unitPriceCents = product.price_cents + (variant?.price_delta_cents ?? 0);

    priced.push({
      productId: product.id,
      variantId: variant?.id ?? null,
      slug: product.slug,
      title: product.title,
      variantName: variant?.name ?? null,
      unitPriceCents,
      quantity,
      lineTotalCents: unitPriceCents * quantity,
      weightGrams: (product.weight_grams ?? 0) * quantity,
      cover: cover ? { storagePath: cover.storage_path, altText: cover.alt_text } : null,
      availableStock,
    });
  }

  return {
    lines: priced,
    removed,
    reduced,
    subtotalCents: priced.reduce((sum, line) => sum + line.lineTotalCents, 0),
    totalWeightGrams: priced.reduce((sum, line) => sum + line.weightGrams, 0),
  };
}
