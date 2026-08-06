"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/safe-next";
import { signInSchema } from "@/lib/validation/auth";

export type SignInState = { status: "idle" } | { status: "error"; message: string };

/**
 * One message for every failure: unknown email, wrong password, unconfirmed
 * email, anything. Distinguishing them would tell an attacker probing emails
 * which ones have accounts.
 */
const SIGN_IN_ERROR = "Email or password is not correct.";

export async function signIn(_previous: SignInState, formData: FormData): Promise<SignInState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Check your details and try again.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { status: "error", message: SIGN_IN_ERROR };
  }

  const next = safeNext(String(formData.get("next") ?? ""));
  redirect(next);
}

export async function signOut(formData?: FormData): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(safeNext(formData ? String(formData.get("next") ?? "") : null, "/"));
}
