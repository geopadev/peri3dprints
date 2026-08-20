/**
 * Kept out of actions.ts because a "use server" module may only export async
 * functions, and this is a plain lookup the page calls while rendering.
 */
const ERROR_MESSAGES: Record<string, string> = {
  empty: "Write something first.",
  amount: "Put in how much they owe, in euros.",
  link: "That does not look like a link.",
  failed: "That did not send. Try again in a moment.",
};

export function inboxErrorMessage(code: string | undefined): string | null {
  if (!code) return null;
  return ERROR_MESSAGES[code] ?? ERROR_MESSAGES.failed ?? null;
}

export function whenAgo(iso: string | null): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  const minutes = Math.round((Date.now() - then) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  return `${days} d ago`;
}
