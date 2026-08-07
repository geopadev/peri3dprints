/**
 * https://wa.me/{number}?text={encoded context}. Strips everything except
 * digits from the settings value, since that is the format wa.me needs and
 * the owner will have typed it with spaces, a plus sign, or both.
 */
export function whatsappLink(rawNumber: string, text: string): string | null {
  const digits = rawNumber.replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
