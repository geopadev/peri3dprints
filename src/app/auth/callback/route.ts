import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/safe-next";
import { destinationFrom } from "./destination";

/**
 * Every email link lands here: signup confirmation and password recovery
 * alike. Owner status has nothing to do with this step any more, since the
 * owner signs in exactly like every other buyer; /admin decides who belongs
 * there on its own.
 *
 * Two shapes of link arrive, because the PKCE shape has a real failure mode
 * that showed up in production: signUp() sets a code_verifier cookie in
 * whatever browser submitted the form, and exchangeCodeForSession() below
 * needs that same cookie back. Someone who fills the form on one device and
 * opens their email on another, which is ordinary and common, has no such
 * cookie, and the exchange fails with a code mismatch even though the link
 * itself was genuine and unused.
 *
 * token_hash + type is the fix: the Confirm signup and Reset Password email
 * templates in the Supabase dashboard link straight here with those instead
 * of the default Supabase-hosted confirmation URL, and verifyOtp() checks the
 * token against Supabase directly with no cookie dependency, so it works in
 * whatever browser opens the link. The `code` branch stays as a fallback for
 * anything already sent under the old template, and drops away once nothing
 * still points at it.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  // Supabase reports a rejected or expired link this way.
  const authError = searchParams.get("error_description") ?? searchParams.get("error");
  if (authError) {
    return NextResponse.redirect(`${origin}/sign-in?error=link`);
  }

  const supabase = await createClient();

  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  if (tokenHash && type) {
    const next = destinationFrom(searchParams.get("redirect_to"), origin);
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) {
      return NextResponse.redirect(`${origin}/sign-in?error=link`);
    }
    return NextResponse.redirect(`${origin}${next}`);
  }

  const code = searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(`${origin}/sign-in?error=link`);
  }

  const next = safeNext(searchParams.get("next"));
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/sign-in?error=link`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
