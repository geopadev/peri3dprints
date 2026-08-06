"use server";

import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/supabase/require-session";
import { changePasswordSchema } from "@/lib/validation/auth";

export type ChangePasswordState =
  { status: "idle" } | { status: "saved" } | { status: "error"; message: string };

export async function changePassword(
  _previous: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  await requireSession("/account");

  const parsed = changePasswordSchema.safeParse({ password: formData.get("password") });
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Check your password and try again.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return { status: "error", message: "Could not update your password. Try again." };
  }

  return { status: "saved" };
}
