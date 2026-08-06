import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/safe-next";

/**
 * Every email link lands here: signup confirmation and password recovery
 * alike, since both use the same PKCE code exchange. Owner status has nothing
 * to do with this step any more, since the owner signs in exactly like every
 * other buyer; /admin decides who belongs there on its own.
 *
 * A Route Handler rather than a Server Action because the redirect carries a
 * query string, which an Action cannot receive directly.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  // Supabase reports a rejected or expired link this way.
  const authError = searchParams.get("error_description") ?? searchParams.get("error");
  if (authError || !code) {
    return NextResponse.redirect(`${origin}/sign-in?error=link`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/sign-in?error=link`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
