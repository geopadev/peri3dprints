import "server-only";
import { headers } from "next/headers";

/**
 * Prefers the configured site URL, falls back to the request host in local dev.
 * Used to build the redirect URLs Supabase Auth emails send people back to.
 */
export async function siteOrigin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");

  const headerList = await headers();
  const host = headerList.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}
