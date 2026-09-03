import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase/config";

/** Paths that must stay reachable without being the owner, or the rejection
 * page would redirect to itself forever. */
const OPEN_ADMIN_PATHS = ["/admin/not-owner"];

function isOpenAdminPath(pathname: string): boolean {
  return OPEN_ADMIN_PATHS.some((open) => pathname === open || pathname.startsWith(`${open}/`));
}

/** Paths any signed in buyer may reach, owner or not. */
const SESSION_ONLY_PATHS = ["/account", "/orders", "/messages"];

function isSessionOnlyPath(pathname: string): boolean {
  return SESSION_ONLY_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

/**
 * Carries any refreshed auth cookies onto a redirect. Without this the session
 * that was just refreshed is dropped and the next request signs the person out.
 */
function redirectTo(
  request: NextRequest,
  current: NextResponse,
  pathname: string,
  next?: string,
): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = next ? `?next=${encodeURIComponent(next)}` : "";

  const redirect = NextResponse.redirect(url);
  for (const cookie of current.cookies.getAll()) {
    redirect.cookies.set(cookie);
  }
  const csp = current.headers.get("Content-Security-Policy");
  if (csp) redirect.headers.set("Content-Security-Policy", csp);
  return redirect;
}

/**
 * Content Security Policy with a per request nonce. Next.js reads the nonce
 * out of this header during server rendering and stamps it on every script it
 * emits, so 'strict-dynamic' can trust those and nothing else. Scripts are the
 * thing worth locking; inline style attributes stay allowed because Radix,
 * next/image and the carousel all position with them and a style attribute
 * cannot carry a nonce.
 */
function buildCsp(nonce: string): string {
  const supabase = supabaseUrl();
  const supabaseWs = supabase.replace(/^https:/, "wss:");
  const isDev = process.env.NODE_ENV === "development";
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' blob: data: ${supabase}`,
    "font-src 'self'",
    `connect-src 'self' ${supabase} ${supabaseWs}${isDev ? " ws://localhost:* http://localhost:*" : ""}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    isDev ? "" : "upgrade-insecure-requests",
  ]
    .filter(Boolean)
    .join("; ");
}

export async function middleware(request: NextRequest) {
  // No Buffer in the edge runtime. A UUID is 128 random bits and its hex is
  // a valid nonce as it stands, so it is used directly rather than base64ed.
  const nonce = crypto.randomUUID().replace(/-/g, "");
  const csp = buildCsp(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  let response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);

  const supabase = createServerClient<Database>(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request: { headers: requestHeaders } });
        response.headers.set("Content-Security-Policy", csp);
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Refreshes the session on every matched request. getUser revalidates against
  // the auth server, unlike getSession which trusts the cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;
  const here = `${pathname}${search}`;

  if (pathname.startsWith("/admin") && !isOpenAdminPath(pathname)) {
    if (!user) {
      return redirectTo(request, response, "/sign-in", here);
    }

    const { data: isOwner, error } = await supabase.rpc("is_owner");
    if (error || !isOwner) {
      return redirectTo(request, response, "/admin/not-owner");
    }
  } else if (isSessionOnlyPath(pathname) && !user) {
    return redirectTo(request, response, "/sign-in", here);
  }

  return response;
}

export const config = {
  matcher: [
    // Everything except static assets and image files.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff2?)$).*)",
  ],
};
