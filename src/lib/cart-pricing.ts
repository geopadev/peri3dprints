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
};

export type PricedCart = {
  lines: PricedCartLine[];
  /** Titles of lines that were dropped: archived, deleted, or otherwise no
   * longer buyable, so the buyer can be told what changed rather than just
   * seeing the cart shrink. */
  removed: { productId: string; variantId: string | null; title: string }[];
  subtotalCents: number;
  totalWeightGrams: number;
};

/**
 * The only place cart prices come from. Every line is looked up fresh
 * against the database and anything archived, deleted, or otherwise not
 * currently buyable is dropped rather than trusted from what the browser sent.
 */
export async function priceCartLines(cartLines: CartLine[]): Promise<PricedCart> {
  if (cartLines.length === 0) {
    return { lines: [], removed: [], subtotalCents: 0, totalWeightGrams: 0 };
  }

  const supabase = await createClient();
  const productIds = [...new Set(cartLines.map((line) => line.productId))];

  const { data: products } = await supabase
    .from("products")
    .select(
      "id, slug, title, status, price_cents, weight_grams, product_images(storage_path, alt_text, position), product_variants(id, name, price_delta_cents)",
    )
    .in("id", productIds);

  const productById = new Map((products ?? []).map((product) => [product.id, product]));

  const priced: PricedCartLine[] = [];
  const removed: PricedCart["removed"] = [];

  for (const line of cartLines) {
    const product = productById.get(line.productId);

    if (!product || product.status !== "active") {
      removed.push({
        productId: line.productId,
        variantId: line.variantId,
        title: product?.title ?? "A print that used to be here",
      });
      continue;
    }

    const variant = line.variantId
      ? (product.product_variants ?? []).find((candidate) => candidate.id === line.variantId)
      : null;

    if (line.variantId && !variant) {
      removed.push({ productId: line.productId, variantId: line.variantId, title: product.title });
      continue;
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
      quantity: line.quantity,
      lineTotalCents: unitPriceCents * line.quantity,
      weightGrams: (product.weight_grams ?? 0) * line.quantity,
      cover: cover ? { storagePath: cover.storage_path, altText: cover.alt_text } : null,
    });
  }

  return {
    lines: priced,
    removed,
    subtotalCents: priced.reduce((sum, line) => sum + line.lineTotalCents, 0),
    totalWeightGrams: priced.reduce((sum, line) => sum + line.weightGrams, 0),
  };
}
