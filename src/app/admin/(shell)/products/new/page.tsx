import type { Metadata } from "next";
import Link from "next/link";
import type { ProductFormValues } from "@/components/admin/product-form";
import { createClient } from "@/lib/supabase/server";
import { ProductFormBridge } from "../product-form-bridge";

export const metadata: Metadata = {
  title: "Add a print",
  robots: { index: false, follow: false },
};

const EMPTY: ProductFormValues = {
  id: null,
  title: "",
  slug: "",
  short_description: "",
  description: "",
  price: "",
  compare_at: "",
  status: "draft",
  made_to_order: true,
  lead_time_days: "3",
  stock_qty: "",
  material: "PLA",
  weight_grams: "",
  length_mm: "",
  width_mm: "",
  height_mm: "",
  print_minutes: "",
  spec_note: "",
  category_id: "",
  tags: "",
  featured: false,
  images: [],
  variants: [],
};

export default async function NewProductPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("position", { ascending: true });

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-5 py-8">
      <div>
        <Link href="/admin/products" className="font-semibold underline">
          Back to prints
        </Link>
        <h1 className="mt-2 text-2xl">Add a print</h1>
      </div>

      <ProductFormBridge initial={EMPTY} categories={categories ?? []} />
    </main>
  );
}
