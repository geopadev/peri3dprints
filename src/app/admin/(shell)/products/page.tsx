import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button, Card, EmptyState, Money, Notice, Tag, UTILITY_TEXT } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { productImageUrl } from "@/lib/product-image-url";
import { ProductFilters } from "./product-filters";

export const metadata: Metadata = {
  title: "Prints",
  robots: { index: false, follow: false },
};

const STATUS_TONE = {
  active: "stock",
  draft: "neutral",
  archived: "sale",
} as const;

const STATUS_LABEL = {
  active: "On the shelf",
  draft: "Draft",
  archived: "Archived",
} as const;

type SearchParams = { q?: string; status?: string };

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { q, status } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select(
      "id, title, slug, price_cents, status, stock_qty, made_to_order, product_images(storage_path, alt_text, position)",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (q && q.trim()) {
    // Escape the PostgREST wildcards so a stray % does not match everything.
    const term = q.trim().replace(/[%_]/g, "");
    if (term) query = query.ilike("title", `%${term}%`);
  }

  if (status === "active" || status === "draft" || status === "archived") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  const products = data ?? [];

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-5 px-5 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl">Prints</h1>
        <Link href="/admin/products/new">
          <Button>Add a print</Button>
        </Link>
      </div>

      <ProductFilters />

      {error && (
        <Notice role="alert">
          <p>Could not load your prints. Reload the page and try again.</p>
        </Notice>
      )}

      {!error && products.length === 0 && (
        <EmptyState
          title="Nothing here yet"
          description={
            q || status
              ? "No print matches that. Clear the filters to see everything."
              : "Add your first print and it will show up here."
          }
          action={
            <Link href="/admin/products/new">
              <Button>Add a print</Button>
            </Link>
          }
        />
      )}

      <ul className="flex flex-col gap-3">
        {products.map((product) => {
          // position is nullable in the schema, so treat a missing one as first.
          const cover = [...(product.product_images ?? [])].sort(
            (a, b) => (a.position ?? 0) - (b.position ?? 0),
          )[0];

          return (
            <li key={product.id}>
              <Link
                href={`/admin/products/${product.id}`}
                className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan focus-visible:outline-solid"
              >
                <Card
                  interactive
                  padded={false}
                  className="flex items-center gap-4 overflow-hidden p-3"
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-card border-2 border-ink bg-paper">
                    {cover ? (
                      <Image
                        src={productImageUrl(cover.storage_path, 128)}
                        alt={cover.alt_text}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : (
                      <span className={`flex h-full items-center justify-center ${UTILITY_TEXT}`}>
                        No photo
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{product.title}</p>
                    <p className="mt-1">
                      <Money cents={product.price_cents} />
                      {!product.made_to_order && product.stock_qty !== null && (
                        <span className={`ml-3 ${UTILITY_TEXT}`}>{product.stock_qty} left</span>
                      )}
                    </p>
                  </div>

                  <Tag tone={STATUS_TONE[product.status]}>{STATUS_LABEL[product.status]}</Tag>
                </Card>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
