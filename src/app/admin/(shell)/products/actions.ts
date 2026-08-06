"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireOwner } from "@/lib/supabase/require-owner";
import { PRODUCT_IMAGES_BUCKET } from "@/lib/product-image-url";
import { productSchema, slugSchema, type ProductInput } from "@/lib/validation/product";

export type SaveResult =
  | { status: "ok"; id: string; savedAt: string }
  | { status: "error"; message: string; fieldErrors?: Record<string, string> };

/**
 * Slug uniqueness is checked here rather than relied on from the unique index,
 * so the owner gets "you already have a print at that address" instead of a
 * database error. The index is still the backstop against a race.
 */
async function slugTaken(slug: string, ignoreId: string | null): Promise<boolean> {
  const supabase = await createClient();
  let query = supabase.from("products").select("id").eq("slug", slug).limit(1);
  if (ignoreId) query = query.neq("id", ignoreId);
  const { data } = await query;
  return (data?.length ?? 0) > 0;
}

function firstFieldErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.map(String).join(".") || "form";
    fieldErrors[key] ??= issue.message;
  }
  return fieldErrors;
}

export async function saveProduct(input: ProductInput): Promise<SaveResult> {
  await requireOwner();

  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Some fields need fixing.",
      fieldErrors: firstFieldErrors(parsed.error.issues),
    };
  }

  const product = parsed.data;
  const supabase = await createClient();

  if (await slugTaken(product.slug, product.id)) {
    return {
      status: "error",
      message: "You already have a print at that web address. Change it and save again.",
      fieldErrors: { slug: "That web address is taken." },
    };
  }

  const row = {
    title: product.title,
    slug: product.slug,
    short_description: product.short_description,
    description: product.description,
    price_cents: product.price_cents,
    compare_at_cents: product.compare_at_cents,
    status: product.status,
    made_to_order: product.made_to_order,
    lead_time_days: product.made_to_order ? product.lead_time_days : null,
    stock_qty: product.made_to_order ? null : product.stock_qty,
    material: product.material,
    weight_grams: product.weight_grams,
    length_mm: product.length_mm,
    width_mm: product.width_mm,
    height_mm: product.height_mm,
    print_minutes: product.print_minutes,
    spec_note: product.spec_note,
    category_id: product.category_id,
    tags: product.tags,
    featured: product.featured,
  };

  const { data: saved, error } = product.id
    ? await supabase.from("products").update(row).eq("id", product.id).select("id").single()
    : await supabase.from("products").insert(row).select("id").single();

  if (error || !saved) {
    return { status: "error", message: "Could not save that. Try again in a moment." };
  }

  const productId = saved.id;

  // Images and variants are replaced wholesale. The form always sends the full
  // list in the order shown, so reconciling row by row would be more code and
  // more ways to end up with a gap in the positions.
  const { data: existingImages } = await supabase
    .from("product_images")
    .select("id, storage_path")
    .eq("product_id", productId);

  const keptPaths = new Set(product.images.map((image) => image.storage_path));
  const orphanPaths = (existingImages ?? [])
    .filter((image) => !keptPaths.has(image.storage_path))
    .map((image) => image.storage_path);

  await supabase.from("product_images").delete().eq("product_id", productId);
  if (product.images.length > 0) {
    await supabase.from("product_images").insert(
      product.images.map((image, index) => ({
        product_id: productId,
        storage_path: image.storage_path,
        alt_text: image.alt_text,
        position: index,
      })),
    );
  }

  // Drop the files the owner removed, so the bucket does not fill up with
  // orphans nobody can see.
  if (orphanPaths.length > 0) {
    await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove(orphanPaths);
  }

  await supabase.from("product_variants").delete().eq("product_id", productId);
  if (product.variants.length > 0) {
    await supabase.from("product_variants").insert(
      product.variants.map((variant, index) => ({
        product_id: productId,
        option_label: variant.option_label,
        name: variant.name,
        swatch_hex: variant.swatch_hex,
        price_delta_cents: variant.price_delta_cents,
        stock_qty: variant.stock_qty,
        sku: variant.sku,
        position: index,
      })),
    );
  }

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}`);

  return {
    status: "ok",
    id: productId,
    savedAt: new Date().toISOString(),
  };
}

export async function deleteProduct(formData: FormData): Promise<void> {
  await requireOwner();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();

  // Collect the storage paths before the cascade removes the rows that name them.
  const { data: images } = await supabase
    .from("product_images")
    .select("storage_path")
    .eq("product_id", id);

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return;

  const paths = (images ?? []).map((image) => image.storage_path);
  if (paths.length > 0) {
    await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove(paths);
  }

  revalidatePath("/admin/products");
  redirect("/admin/products");
}

/** Used by the form to tell the owner a slug is taken before they hit save. */
export async function checkSlug(
  slug: string,
  ignoreId: string | null,
): Promise<{ available: boolean; message?: string }> {
  await requireOwner();

  const parsed = slugSchema.safeParse(slug);
  if (!parsed.success) {
    return { available: false, message: parsed.error.issues[0]?.message };
  }

  const taken = await slugTaken(parsed.data, ignoreId);
  return taken ? { available: false, message: "That web address is taken." } : { available: true };
}
