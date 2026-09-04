"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/safe-next";
import { siteOrigin } from "@/lib/site-origin";
import { signUpSchema } from "@/lib/validation/auth";

export type SignUpState =
  { status: "idle" } | { status: "error"; message: string; fieldErrors?: Record<string, string> };

export async function signUp(_previous: SignUpState, formData: FormData): Promise<SignUpState> {
  const next = safeNext(String(formData.get("next") ?? ""));

  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    display_name: formData.get("display_name"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "form";
      fieldErrors[key] ??= issue.message;
    }
    return { status: "error", message: "Check the details below.", fieldErrors };
  }

  const supabase = await createClient();
  const origin = await siteOrigin();

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { display_name: parsed.data.display_name },
      // A bare destination, not a pre-built callback URL: the Confirm signup
      // template renders this as {{ .RedirectTo }} appended to its own
      // token_hash link, and nesting a second query string inside that value
      // would break it.
      emailRedirectTo: `${origin}${next}`,
    },
  });

  if (error) {
    return {
      status: "error",
      message: "Could not create that account just now. Try again in a moment.",
    };
  }

  /*
    A session here means email confirmation is switched off in the Supabase
    dashboard, so signUp() signed them in there and then and there is no email
    coming. Sending them to "check your inbox" in that case would leave them
    staring at a page waiting for something that will never arrive, while
    already being signed in.

    Only a genuinely new signup with confirmation off produces a session, so
    reading it gives nothing away: every other case, including an email that
    already has an account, still falls through to the same page below.
  */
  if (data.session) {
    redirect(next);
  }

  // With confirmation required, Supabase never errors here for an email that
  // already has a confirmed account: it returns a fake user with an empty
  // identities array instead, specifically so callers cannot probe for
  // registered emails. Showing "check your inbox" either way, for a genuinely
  // new signup and for an existing account alike, is what keeps that
  // protection intact rather than quietly working around it.
  redirect(
    `/auth/confirm?email=${encodeURIComponent(parsed.data.email)}&next=${encodeURIComponent(next)}`,
  );
}
