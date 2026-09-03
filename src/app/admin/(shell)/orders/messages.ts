const ERROR_MESSAGES: Record<string, string> = {
  link: "That does not look like an https link.",
  amount: "Put in how much they owe, in euros.",
  status: "That status is not one of the steps.",
  tracking: "Add the tracking number first.",
  noconvo: "This order has no conversation to send the link into.",
  failed: "Could not save that. Try again in a moment.",
};
export function orderErrorMessage(code: string | undefined): string | null {
  if (!code) return null;
  return ERROR_MESSAGES[code] ?? ERROR_MESSAGES.failed ?? null;
}
