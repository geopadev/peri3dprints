import type { MetadataRoute } from "next";
import { siteOrigin } from "@/lib/site-origin";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const site = await siteOrigin();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/styleguide",
          "/messages",
          "/account",
          "/order/",
          "/ask-to-buy",
          "/cart",
          "/stall",
        ],
      },
    ],
    sitemap: site ? `${site}/sitemap.xml` : undefined,
  };
}
