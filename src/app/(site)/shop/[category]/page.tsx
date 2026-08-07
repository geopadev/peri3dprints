import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ShopListing, type ShopSearchParams } from "../shop-listing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("name")
    .eq("slug", category)
    .maybeSingle();

  return { title: data?.name ?? "Shop" };
}

export default async function ShopCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<ShopSearchParams>;
}) {
  const { category } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", category)
    .maybeSingle();

  if (!data) notFound();

  return <ShopListing categorySlug={category} searchParams={await searchParams} />;
}
