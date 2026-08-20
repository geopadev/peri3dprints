import "server-only";
import { createClient } from "@/lib/supabase/server";

export type ProductSpec = {
  material: string | null;
  dimensionsMm: readonly [number, number, number] | null;
  weightGrams: number | null;
  printMinutes: number | null;
  note: string | null;
};

export type ProductCardData = {
  id: string;
  slug: string;
  title: string;
  priceCents: number;
  /** Set only when it is above priceCents, which is what makes it a sale. */
  compareAtCents: number | null;
  stockQty: number | null;
  madeToOrder: boolean;
  spec: ProductSpec;
  cover: { storagePath: string; altText: string } | null;
};

type CardRow = {
  id: string;
  slug: string;
  title: string;
  price_cents: number;
  compare_at_cents: number | null;
  stock_qty: number | null;
  made_to_order: boolean | null;
  material: string | null;
  weight_grams: number | null;
  length_mm: number | null;
  width_mm: number | null;
  height_mm: number | null;
  print_minutes: number | null;
  spec_note: string | null;
  product_images: { storage_path: string; alt_text: string; position: number | null }[] | null;
};

const CARD_FIELDS =
  "id, slug, title, price_cents, compare_at_cents, stock_qty, made_to_order, material, weight_grams, length_mm, width_mm, height_mm, print_minutes, spec_note, product_images(storage_path, alt_text, position)";

function toSpec(row: CardRow): ProductSpec {
  const hasDims = row.length_mm && row.width_mm && row.height_mm;
  return {
    material: row.material,
    dimensionsMm: hasDims ? [row.length_mm!, row.width_mm!, row.height_mm!] : null,
    weightGrams: row.weight_grams,
    printMinutes: row.print_minutes,
    note: row.spec_note,
  };
}

function toCardData(row: CardRow): ProductCardData {
  const images = [...(row.product_images ?? [])].sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0),
  );
  const first = images[0];

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    priceCents: row.price_cents,
    compareAtCents:
      row.compare_at_cents && row.compare_at_cents > row.price_cents ? row.compare_at_cents : null,
    stockQty: row.stock_qty,
    madeToOrder: row.made_to_order ?? true,
    spec: toSpec(row),
    cover: first ? { storagePath: first.storage_path, altText: first.alt_text } : null,
  };
}

export async function getHeroProducts(limit: number): Promise<ProductCardData[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select(CARD_FIELDS)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map(toCardData);
}

export type ShopSort = "newest" | "price";

export type ShopFilters = {
  categorySlug?: string;
  sort?: ShopSort;
  inStockOnly?: boolean;
  page?: number;
  /** Title search, from the header search icon. Searches everything, so it
   * is combined with the category filter rather than overriding it. */
  query?: string;
};

export const SHOP_PAGE_SIZE = 24;

export type ShopResult = {
  products: ProductCardData[];
  total: number;
  page: number;
  pageCount: number;
};

export async function getShopProducts(filters: ShopFilters): Promise<ShopResult> {
  const supabase = await createClient();
  const page = Math.max(1, filters.page ?? 1);
  const from = (page - 1) * SHOP_PAGE_SIZE;
  const to = from + SHOP_PAGE_SIZE - 1;

  // Resolved to an id and filtered on the plain category_id column, rather
  // than an embedded join: Supabase's select() type parser cannot handle a
  // select string that varies at runtime, and a join was never needed here
  // anyway since products already carries the foreign key.
  let categoryId: string | null = null;
  if (filters.categorySlug) {
    const { data: category } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", filters.categorySlug)
      .maybeSingle();

    if (!category) {
      return { products: [], total: 0, page, pageCount: 1 };
    }

    categoryId = category.id;
  }

  let query = supabase
    .from("products")
    .select(CARD_FIELDS, { count: "exact" })
    .eq("status", "active");

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  if (filters.inStockOnly) {
    query = query.or("made_to_order.eq.true,stock_qty.is.null,stock_qty.gt.0");
  }

  if (filters.query?.trim()) {
    // Escapes PostgREST's own wildcards so a stray % or _ cannot broaden the
    // match into effectively "everything".
    const term = filters.query.trim().replace(/[%_]/g, "");
    if (term) query = query.ilike("title", `%${term}%`);
  }

  query =
    filters.sort === "price"
      ? query.order("price_cents", { ascending: true })
      : query.order("created_at", { ascending: false });

  const { data, count } = await query.range(from, to);
  const total = count ?? 0;

  return {
    products: (data ?? []).map(toCardData),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / SHOP_PAGE_SIZE)),
  };
}

export type ProductVariantData = {
  id: string;
  name: string;
  swatchHex: string | null;
  priceDeltaCents: number;
  stockQty: number | null;
};

export type ProductDetail = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string | null;
  description: string | null;
  priceCents: number;
  compareAtCents: number | null;
  madeToOrder: boolean;
  leadTimeDays: number | null;
  stockQty: number | null;
  spec: ProductSpec;
  categoryId: string | null;
  images: { storagePath: string; altText: string }[];
  variants: ProductVariantData[];
};

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select(
      `id, slug, title, short_description, description, price_cents, compare_at_cents,
       made_to_order, lead_time_days, stock_qty,
       material, weight_grams, length_mm, width_mm, height_mm, print_minutes, spec_note,
       category_id,
       product_images(storage_path, alt_text, position),
       product_variants(id, name, swatch_hex, price_delta_cents, stock_qty, position)`,
    )
    .eq("slug", slug)
    // Explicit even though RLS already hides drafts from a buyer session, so
    // this stays correct even if the policy ever changes.
    .eq("status", "active")
    .maybeSingle();

  if (!data) return null;

  const images = [...(data.product_images ?? [])].sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0),
  );
  const variants = [...(data.product_variants ?? [])].sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0),
  );

  return {
    id: data.id,
    slug: data.slug,
    title: data.title,
    shortDescription: data.short_description,
    description: data.description,
    priceCents: data.price_cents,
    compareAtCents: data.compare_at_cents,
    madeToOrder: data.made_to_order ?? true,
    leadTimeDays: data.lead_time_days,
    stockQty: data.stock_qty,
    spec: toSpec(data as unknown as CardRow),
    categoryId: data.category_id,
    images: images.map((image) => ({ storagePath: image.storage_path, altText: image.alt_text })),
    variants: variants.map((variant) => ({
      id: variant.id,
      name: variant.name,
      swatchHex: variant.swatch_hex,
      priceDeltaCents: variant.price_delta_cents ?? 0,
      stockQty: variant.stock_qty,
    })),
  };
}

export async function getRelatedProducts(
  categoryId: string,
  excludeProductId: string,
  limit: number,
): Promise<ProductCardData[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select(CARD_FIELDS)
    .eq("status", "active")
    .eq("category_id", categoryId)
    .neq("id", excludeProductId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map(toCardData);
}

export async function getCategories(): Promise<{ slug: string; name: string }[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("slug, name")
    .order("position", { ascending: true });
  return data ?? [];
}

export type ShopSettings = {
  announcement: string | null;
  whatsappNumber: string | null;
};

export async function getSettings(): Promise<ShopSettings> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("settings")
    .select("announcement, whatsapp_number")
    .eq("id", 1)
    .maybeSingle();
  return {
    announcement: data?.announcement ?? null,
    whatsappNumber: data?.whatsapp_number ?? null,
  };
}
