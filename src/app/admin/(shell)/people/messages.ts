/**
 * Kept out of actions.ts because a "use server" module may only export async
 * functions, and this is a plain lookup the page calls while rendering.
 *
 * Plain form actions cannot return a value, so failures come back as a query
 * parameter and get turned into a sentence here. The codes match the errcodes
 * set_user_role raises, so the database stays the single source of truth about
 * what is allowed.
 */
const ERROR_MESSAGES: Record<string, string> = {
  denied: "Only an owner can change what someone is allowed to do.",
  "last-owner": "That is the only owner left. Make someone else an owner first.",
  missing: "That person no longer has an account.",
  invalid: "Unknown role.",
  failed: "Could not save that. Try again in a moment.",
};

export function peopleErrorMessage(code: string | undefined): string | null {
  if (!code) return null;
  return ERROR_MESSAGES[code] ?? ERROR_MESSAGES.failed ?? null;
}

/** Maps a Postgres errcode from set_user_role onto one of the codes above. */
export function codeForPostgresError(pgCode: string | undefined): string {
  if (pgCode === "42501") return "denied";
  if (pgCode === "23514") return "last-owner";
  if (pgCode === "P0002") return "missing";
  if (pgCode === "22023") return "invalid";
  return "failed";
}
