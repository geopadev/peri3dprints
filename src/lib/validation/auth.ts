import { z } from "zod";

/**
 * One schema per form, used by the client form and re-used by the Server
 * Action, so the browser and the server can never disagree about what is
 * valid. Length is the only password rule: no invented uppercase or symbol
 * requirement.
 */

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Enter your email address.")
  .email("That does not look like an email address.");

export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters.");

export const displayNameSchema = z
  .string()
  .trim()
  .min(1, "Tell us what to call you.")
  .max(80, "Keep it shorter.");

export const signInSchema = z.object({
  email: emailSchema,
  // Presence only. The real check happens server side against Supabase, and
  // sign in failures never say which half was wrong.
  password: z.string().min(1, "Enter your password."),
});

export type SignInInput = z.infer<typeof signInSchema>;

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  display_name: displayNameSchema,
});

export type SignUpInput = z.infer<typeof signUpSchema>;

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  password: passwordSchema,
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z.object({
  password: passwordSchema,
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
