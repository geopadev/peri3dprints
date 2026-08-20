/**
 * Kept out of actions.ts because a "use server" module may only export async
 * functions, and these are plain lookups the pages call while rendering.
 */
const ERROR_MESSAGES: Record<string, string> = {
  empty: "Write something or add a picture first.",
  toolong: "That message is too long to send.",
  signedout: "Sign in first and I will keep what you wrote.",
  notyours: "That conversation is not yours.",
  failed: "That did not send. Try again in a moment.",
};

export function chatErrorMessage(code: string | undefined): string | null {
  if (!code) return null;
  return ERROR_MESSAGES[code] ?? ERROR_MESSAGES.failed ?? null;
}
