import type { NextConfig } from "next";

/**
 * Product images live in a public Supabase Storage bucket, so next/image has to
 * be told that host is allowed before it will optimise them. Derived from the
 * env var rather than hardcoded, so dev and production each allow their own
 * project and nothing else.
 */
function supabaseImageHost(): URL["hostname"] | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

const host = supabaseImageHost();

/**
 * Headers that do not change per request. The Content-Security-Policy is not
 * here: it carries a per request nonce, so it is set in middleware.
 */
const securityHeaders = [
  // Two years, subdomains too, and eligible for the browser preload list.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  images: {
    remotePatterns: host
      ? [
          {
            protocol: "https",
            hostname: host,
            pathname: "/storage/v1/**",
          },
        ]
      : [],
  },
};

export default nextConfig;
