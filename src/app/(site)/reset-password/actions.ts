"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resetPasswordSchema } from "@/lib/validation/auth";

export type ResetPasswordState = { status: "idle" } | { status: "error"; message: string };

export async function resetPassword(
  _previous: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const parsed = resetPasswordSchema.safeParse({ password: formData.get("password") });
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Check your password and try again.",
    };
  }

  const supabase = await createClient();

  // A session exists here because /auth/callback already exchanged the
  // recovery code before redirecting to this page. No session means the link
  // was invalid or expired, which the page itself checks before ever showing
  // this form.
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return { status: "error", message: "Could not update your password. Try again." };
  }

  redirect("/account");
}
