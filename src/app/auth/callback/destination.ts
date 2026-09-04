import { safeNext } from "@/lib/safe-next";

/**
 * redirect_to arrives as a full URL (Supabase's {{ .RedirectTo }} template
 * variable renders whatever absolute URL was passed as emailRedirectTo), so
 * this pulls out just the path and re-validates it with the same guard every
 * other post-sign-in redirect in the app uses, rather than trusting a URL
 * that arrived on the query string of a request no session has been
 * established for yet.
 *
 * Pulled out of route.ts into its own module because Next only allows a
 * fixed set of named exports from a Route Handler file (GET, POST, config,
 * and a short allowlist); anything else fails the generated route types.
 */
export function destinationFrom(redirectTo: string | null, origin: string): string {
  if (!redirectTo) return "/";
  try {
    const target = new URL(redirectTo, origin);
    if (target.origin !== origin) return "/";
    return safeNext(`${target.pathname}${target.search}`);
  } catch {
    return "/";
  }
}
