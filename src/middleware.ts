import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase/config";

/**
 * Admin paths that must stay reachable without being the owner, otherwise the
 * login and the rejection page would redirect to themselves forever.
 */
const OPEN_ADMIN_PATHS = ["/admin/login", "/admin/not-owner"];

function isOpenAdminPath(pathname: string): boolean {
  return OPEN_ADMIN_PATHS.some((open) => pathname === open || pathname.startsWith(`${open}/`));
}

/**
 * Carries any refreshed auth cookies onto a redirect. Without this the session
 * that was just refreshed is dropped and the next request signs the user out.
 */
function redirectPreservingSession(
  request: NextRequest,
  current: NextResponse,
  pathname: string,
): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";

  const redirect = NextResponse.redirect(url);
  for (const cookie of current.cookies.getAll()) {
    redirect.cookies.set(cookie);
  }
  return redirect;
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
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

  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") && !isOpenAdminPath(pathname)) {
    // An anonymous buyer session is a signed in user, but it is not a login.
    if (!user || user.is_anonymous) {
      return redirectPreservingSession(request, response, "/admin/login");
    }

    const { data: isOwner, error } = await supabase.rpc("is_owner");
    if (error || !isOwner) {
      return redirectPreservingSession(request, response, "/admin/not-owner");
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Everything except static assets and image files.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff2?)$).*)",
  ],
};
