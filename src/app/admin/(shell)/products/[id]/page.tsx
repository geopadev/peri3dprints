import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui";
import type { ProductFormValues } from "@/components/admin/product-form";
import { createClient } from "@/lib/supabase/server";
import { ProductFormBridge } from "../product-form-bridge";
import { deleteProduct } from "../actions";

export const metadata: Metadata = {
  title: "Edit print",
  robots: { index: false, follow: false },
};

function centsToEuro(cents: number | null): string {
  if (cents === null) return "";
  return (cents / 100).toFixed(2);
}

function text(value: string | null): string {
  return value ?? "";
}

function num(value: number | null): string {
  return value === null ? "" : String(value);
}

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: product }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select(
        "*, product_images(id, storage_path, alt_text, position), product_variants(id, option_label, name, swatch_hex, price_delta_cents, stock_qty, sku, position)",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase.from("categories").select("id, name").order("position", { ascending: true }),
  ]);

  if (!product) notFound();

  const initial: ProductFormValues = {
    id: product.id,
    title: product.title,
    slug: product.slug,
    short_description: text(product.short_description),
    description: text(product.description),
    price: centsToEuro(product.price_cents),
    compare_at: centsToEuro(product.compare_at_cents),
    status: product.status,
    made_to_order: product.made_to_order ?? true,
    lead_time_days: num(product.lead_time_days),
    stock_qty: num(product.stock_qty),
    material: text(product.material),
    weight_grams: num(product.weight_grams),
    length_mm: num(product.length_mm),
    width_mm: num(product.width_mm),
    height_mm: num(product.height_mm),
    print_minutes: num(product.print_minutes),
    spec_note: text(product.spec_note),
    category_id: text(product.category_id),
    tags: (product.tags ?? []).join(", "),
    featured: product.featured ?? false,
    images: [...(product.product_images ?? [])]
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .map((image, index) => ({
        id: image.id,
        storage_path: image.storage_path,
        alt_text: image.alt_text,
        position: index,
      })),
    variants: [...(product.product_variants ?? [])]
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .map((variant, index) => ({
        id: variant.id,
        option_label: variant.option_label,
        name: variant.name,
        swatch_hex: variant.swatch_hex,
        price_delta_cents: variant.price_delta_cents ?? 0,
        stock_qty: variant.stock_qty,
        sku: variant.sku,
        position: index,
      })),
  };

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-5 py-8">
      <div>
        <Link href="/admin/products" className="font-semibold underline">
          Back to prints
        </Link>
        <h1 className="mt-2 text-2xl">{product.title}</h1>
      </div>

      <ProductFormBridge initial={initial} categories={categories ?? []} />

      <section className="flex flex-col gap-3 border-t-2 border-ink pt-6">
        <h2 className="text-xl">Delete this print</h2>
        <p>
          It goes for good, along with its photos. Orders that already include it keep their own
          copy of the name and price.
        </p>
        <form action={deleteProduct}>
          <input type="hidden" name="id" value={product.id} />
          <Button type="submit" variant="danger">
            Delete print
          </Button>
        </form>
      </section>
    </main>
  );
}
