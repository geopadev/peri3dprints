"use server";

import { createClient } from "@/lib/supabase/server";
import { siteOrigin } from "@/lib/site-origin";
import { emailSchema } from "@/lib/validation/auth";

export type ForgotPasswordState =
  { status: "idle" } | { status: "sent" } | { status: "error"; message: string };

export async function requestPasswordReset(
  _previous: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Check your email." };
  }

  const supabase = await createClient();
  const origin = await siteOrigin();

  // Supabase does not error for an email with no account here either, which
  // is why the message below is the same regardless of what actually happened.
  await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/reset-password")}`,
  });

  return { status: "sent" };
}
