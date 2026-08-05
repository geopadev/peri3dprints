import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Magic link lands here. Exchanges the code for a session, then decides where the
 * person actually belongs based on profiles.role.
 *
 * This is a Route Handler rather than a Server Action because the auth provider
 * redirects the browser here with a query string, which an Action cannot receive.
 */

/** Blocks the `next` parameter from being used as an open redirect. */
function safeNext(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/admin";
  return value;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  // Supabase reports a rejected or expired link this way.
  const authError = searchParams.get("error_description") ?? searchParams.get("error");
  if (authError) {
    return NextResponse.redirect(`${origin}/admin/login?error=link`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/admin/login?error=link`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/admin/login?error=link`);
  }

  const { data: isOwner, error: ownerError } = await supabase.rpc("is_owner");
  if (ownerError || !isOwner) {
    return NextResponse.redirect(`${origin}/admin/not-owner`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
