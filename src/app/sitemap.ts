import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { siteOrigin } from "@/lib/site-origin";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = await siteOrigin();
  const supabase = await createClient();
  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select("slug, updated_at")
      .eq("status", "active")
      .not("tags", "cs", "{quote}"),
    supabase.from("categories").select("slug"),
  ]);
  const pages: MetadataRoute.Sitemap = [
    "",
    "/shop",
    "/custom",
    "/privacy",
    "/terms",
    "/shipping",
    "/returns",
  ].map((p) => ({
    url: `${site}${p}`,
    changeFrequency: p === "" || p === "/shop" ? "daily" : "monthly",
    priority: p === "" ? 1 : 0.6,
  }));
  return [
    ...pages,
    ...(categories ?? []).map((c) => ({
      url: `${site}/shop/${c.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...(products ?? []).map((p) => ({
      url: `${site}/product/${p.slug}`,
      lastModified: p.updated_at ?? undefined,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
