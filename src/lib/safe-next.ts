/**
 * Guards the `next` query param against becoming an open redirect. Used by
 * every place a signed out visitor is sent to /sign-in and then bounced back:
 * "Ask to buy", opening chat, /admin, /account, /orders, /messages.
 */
export function safeNext(value: string | null | undefined, fallback = "/"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}
