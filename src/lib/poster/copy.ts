/**
 * Lines for above the QR. CLAUDE.md section 4: how the owner talks at his
 * stall, no dashes, no marketing words, sentence case.
 */
export const HEADLINE_PRESETS = [
  "Scan to see everything I print",
  "The whole shop, on your phone",
  "More prints than fit on this table",
  "Missed something? It is all online.",
] as const;

export const HEADLINE_MAX = 70;

/** Under the QR, in the utility voice. */
export const POSTER_FOOTNOTE = "Point your camera at it";

/**
 * The marker that tells Vercel Analytics a visit came off the stall rather
 * than out of a search. A query param rather than a cookie, so it stays
 * cookieless and needs no consent banner.
 */
export const STALL_MARKER = "s=stall";

export function posterUrl(origin: string, withMarker: boolean): string {
  const trimmed = origin.trim().replace(/\/+$/, "");
  if (!withMarker) return trimmed || origin.trim();
  return `${trimmed}/?${STALL_MARKER}`;
}
