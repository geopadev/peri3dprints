/**
 * Kept out of actions.ts because a "use server" module may only export async
 * functions, and this is a plain lookup the page calls while rendering.
 *
 * Plain form actions cannot return a value, so failures come back as a query
 * parameter and get turned into a sentence here.
 */
const ERROR_MESSAGES: Record<string, string> = {
  invalid: "Check the name and the web address.",
  taken: "You already have a category at that web address.",
  failed: "Could not save that. Try again in a moment.",
};

export function categoryErrorMessage(code: string | undefined): string | null {
  if (!code) return null;
  return ERROR_MESSAGES[code] ?? ERROR_MESSAGES.failed ?? null;
}
