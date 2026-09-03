import "server-only";
import { Resend } from "resend";
import { render } from "@react-email/components";
import type { ReactElement } from "react";

/**
 * Every email goes through here. With no RESEND_API_KEY the send is skipped
 * and logged rather than thrown: an email that cannot go out must never fail
 * the order or the message it is about.
 */
export async function sendEmail(input: {
  to: string;
  subject: string;
  react: ReactElement;
}): Promise<{ ok: boolean; skipped?: true }> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) {
    console.warn(
      `[email] skipped "${input.subject}" to ${input.to}: RESEND_API_KEY or EMAIL_FROM not set`,
    );
    return { ok: false, skipped: true };
  }

  const resend = new Resend(key);
  // Plain text alongside HTML, so the message reads in any client.
  const text = await render(input.react, { plainText: true });
  const { error } = await resend.emails.send({
    from,
    to: input.to,
    subject: input.subject,
    react: input.react,
    text,
  });
  if (error) {
    console.error("[email] failed", input.subject, error);
    return { ok: false };
  }
  return { ok: true };
}
