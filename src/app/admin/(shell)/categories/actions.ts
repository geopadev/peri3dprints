"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireOwner } from "@/lib/supabase/require-owner";
import { categorySchema, slugify } from "@/lib/validation/product";

/**
 * These are plain `<form action={...}>` handlers, so they return void and the
 * page keeps working with no client JavaScript. Failures come back as a query
 * parameter rather than a return value, which a plain form action cannot carry.
 * The wording for those codes lives in messages.ts, because a "use server"
 * module may only export async functions.
 */

export async function saveCategory(formData: FormData): Promise<void> {
  await requireOwner();

  const name = String(formData.get("name") ?? "");
  const rawSlug = String(formData.get("slug") ?? "").trim();

  const parsed = categorySchema.safeParse({
    id: String(formData.get("id") ?? ""),
    name,
    slug: rawSlug || slugify(name),
    position: Number(formData.get("position") ?? 0),
  });

  if (!parsed.success) redirect("/admin/categories?error=invalid");

  const category = parsed.data;
  const supabase = await createClient();

  const row = { name: category.name, slug: category.slug, position: category.position };

  const { error } = category.id
    ? await supabase.from("categories").update(row).eq("id", category.id)
    : await supabase.from("categories").insert(row);

  if (error) {
    redirect(`/admin/categories?error=${error.code === "23505" ? "taken" : "failed"}`);
  }

  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

export async function deleteCategory(formData: FormData): Promise<void> {
  await requireOwner();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  // products.category_id is ON DELETE SET NULL, so prints survive this.
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) redirect("/admin/categories?error=failed");

  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}
