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

  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { display_name: parsed.data.display_name },
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    return {
      status: "error",
      message: "Could not create that account just now. Try again in a moment.",
    };
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
