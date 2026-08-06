/**
 * Kept out of actions.ts because a "use server" module may only export async
 * functions, and this is a plain lookup the page calls while rendering.
 */
const ERROR_MESSAGES: Record<string, string> = {
  invalid: "Check what you typed and try again.",
  failed: "Could not save that. Try again in a moment.",
};

export function settingsErrorMessage(code: string | undefined): string | null {
  if (!code) return null;
  return ERROR_MESSAGES[code] ?? ERROR_MESSAGES.failed ?? null;
}
