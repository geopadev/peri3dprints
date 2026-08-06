"use client";

import { ProductForm, type ProductFormValues } from "@/components/admin/product-form";
import { saveProduct, type SaveResult } from "./actions";
import { euroToCents, optionalEuroToCents } from "@/lib/validation/product";

/**
 * Turns what the owner typed into what the schema expects, then hands it to the
 * Server Action. Prices are strings in the form because that is what he types,
 * and integer cents from here on.
 */
function toNumberOrNull(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function ProductFormBridge({
  initial,
  categories,
}: {
  initial: ProductFormValues;
  categories: { id: string; name: string }[];
}) {
  async function onSave(values: ProductFormValues): Promise<SaveResult> {
    const price = euroToCents.safeParse(values.price);
    if (!price.success) {
      return {
        status: "error",
        message: "Check the price.",
        fieldErrors: { price_cents: price.error.issues[0]?.message ?? "Check the price." },
      };
    }

    const compareAt = optionalEuroToCents.safeParse(values.compare_at);
    if (!compareAt.success) {
      return {
        status: "error",
        message: "Check the old price.",
        fieldErrors: {
          compare_at_cents: compareAt.error.issues[0]?.message ?? "Check the old price.",
        },
      };
    }

    return saveProduct({
      id: values.id,
      title: values.title,
      slug: values.slug,
      short_description: values.short_description,
      description: values.description,
      price_cents: price.data,
      compare_at_cents: compareAt.data,
      status: values.status,
      made_to_order: values.made_to_order,
      lead_time_days: toNumberOrNull(values.lead_time_days),
      stock_qty: toNumberOrNull(values.stock_qty),
      material: values.material.trim() || null,
      weight_grams: toNumberOrNull(values.weight_grams),
      length_mm: toNumberOrNull(values.length_mm),
      width_mm: toNumberOrNull(values.width_mm),
      height_mm: toNumberOrNull(values.height_mm),
      print_minutes: toNumberOrNull(values.print_minutes),
      spec_note: values.spec_note.trim() || null,
      category_id: values.category_id || null,
      tags: values.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      featured: values.featured,
      images: values.images,
      variants: values.variants,
    });
  }

  return <ProductForm initial={initial} categories={categories} onSave={onSave} />;
}
