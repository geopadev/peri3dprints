import type { NextConfig } from "next";

/**
 * Product images live in a public Supabase Storage bucket and are served through
 * Supabase image transforms, so next/image has to be told that host is allowed.
 * Derived from the env var rather than hardcoded, so dev and production each
 * allow their own project and nothing else.
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

const nextConfig: NextConfig = {
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
