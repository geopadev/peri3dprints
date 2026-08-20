import { CategoryChips } from "@/components/shop/category-chips";
import { Pagination } from "@/components/shop/pagination";
import { ProductGrid } from "@/components/shop/product-grid";
import { ShopFilterBar } from "@/components/shop/shop-filter-bar";
import { getShopProducts, type ShopSort } from "@/lib/products";

export type ShopSearchParams = {
  sort?: string;
  inStock?: string;
  page?: string;
  q?: string;
};

/**
 * Shared between /shop and /shop/[category], since the brief calls for the
 * same grid, filters and pagination on both, differing only in which
 * category (if any) scopes the results.
 */
export async function ShopListing({
  categorySlug,
  searchParams,
}: {
  categorySlug?: string;
  searchParams: ShopSearchParams;
}) {
  const sort: ShopSort = searchParams.sort === "price" ? "price" : "newest";
  const inStockOnly = searchParams.inStock === "1";
  const page = Math.max(1, Number(searchParams.page) || 1);
  const query = searchParams.q;

  const { products, pageCount } = await getShopProducts({
    categorySlug,
    sort,
    inStockOnly,
    page,
    query,
  });

  function hrefForPage(target: number): string {
    const params = new URLSearchParams();
    if (sort === "price") params.set("sort", "price");
    if (inStockOnly) params.set("inStock", "1");
    if (query) params.set("q", query);
    if (target > 1) params.set("page", String(target));
    const qs = params.toString();
    const base = categorySlug ? `/shop/${categorySlug}` : "/shop";
    return qs ? `${base}?${qs}` : base;
  }

  return (
    <main className="flex flex-col gap-6 px-5 py-8">
      {/* A wash rather than a fill. This page is a working tool and the grid
          is the point, so the controls get a frame, not a slab shouting over
          two dozen products. */}
      <div className="-mx-5 -mt-8 flex flex-col gap-4 border-b-2 border-ink bg-info-wash px-5 pt-8 pb-5">
        <h1 className="text-2xl">{query ? `Results for "${query}"` : "Shop"}</h1>
        <CategoryChips activeSlug={categorySlug} />
        <ShopFilterBar />
      </div>

      <ProductGrid
        products={products}
        emptyTitle="Nothing matches"
        emptyDescription="Try a different filter, or message me and I'll print what you want."
      />

      <Pagination page={page} pageCount={pageCount} hrefForPage={hrefForPage} />
    </main>
  );
}
