"use server";

import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/safe-next";
import { siteOrigin } from "@/lib/site-origin";
import { emailSchema } from "@/lib/validation/auth";

export type ResendState =
  { status: "idle" } | { status: "sent" } | { status: "error"; message: string };

/**
 * The client component owns the cooldown timer. This just re-sends, and stays
 * generic on failure so it cannot be used to check whether an email is real.
 */
export async function resendConfirmation(
  _previous: ResendState,
  formData: FormData,
): Promise<ResendState> {
  const email = emailSchema.safeParse(formData.get("email"));
  if (!email.success) {
    return { status: "error", message: "That does not look like an email address." };
  }

  const next = safeNext(String(formData.get("next") ?? ""));
  const supabase = await createClient();
  const origin = await siteOrigin();

  await supabase.auth.resend({
    type: "signup",
    email: email.data,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  return { status: "sent" };
}
