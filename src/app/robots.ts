import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
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
        ],
      },
    ],
    sitemap: site ? `${site}/sitemap.xml` : undefined,
  };
}
