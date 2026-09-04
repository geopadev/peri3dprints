import "server-only";
import { headers } from "next/headers";

/**
 * The absolute origin this deployment is reachable at. Used to build the links
 * inside Supabase Auth emails, so getting it wrong sends a real buyer to a
 * page on their own machine.
 *
 * Order matters. NEXT_PUBLIC_SITE_URL wins, except when it says localhost and
 * we are plainly not on localhost: that combination means the variable was
 * copied from .env.example into a real deployment, which is exactly how the
 * confirmation email ended up pointing at localhost:3000. On Vercel the real
 * host is always available, so prefer it rather than trusting a stale value.
 */
function isLocal(url: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])/i.test(url);
}

export async function siteOrigin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  const onVercel = Boolean(process.env.VERCEL);

  if (configured && !(onVercel && isLocal(configured))) return configured;

  // Production domain first, so a preview deployment still sends people to the
  // real site when that is what is wanted; the per deployment URL otherwise.
  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL ?? null;
  if (vercelHost) return `https://${vercelHost.replace(/^https?:\/\//, "")}`;

  const headerList = await headers();
  const host = headerList.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https";
  return `${protocol}://${host}`;
}
