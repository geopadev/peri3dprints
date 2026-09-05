/**
 * What the poster says, in the three languages that walk past the stall:
 * English, Greek, and Hebrew for the Israeli visitors.
 *
 * CLAUDE.md section 4 governs the English: how the owner talks at his stall,
 * no dashes, no marketing words. The other two are translations of it, and
 * every one of them is editable in the admin, because a translation nobody
 * can correct is a translation that gets printed wrong fifty times.
 */
export const DEFAULT_TEXT = {
  english: "Missed something? It is all online.\nScan to view my website!",
  greek: "Έχασες κάτι; Είναι όλα online.\nΣκάναρε για να δεις την ιστοσελίδα μου!",
  hebrew: "פספסתם משהו? הכל נמצא אונליין.\nסרקו כדי לראות את האתר שלי!",
} as const;

export type PosterLanguage = keyof typeof DEFAULT_TEXT;

export const LANGUAGE_LABELS: Record<PosterLanguage, string> = {
  english: "English",
  greek: "Greek",
  hebrew: "Hebrew",
};

/** Per language, because a Greek sentence is longer than its English one. */
export const TEXT_MAX = 160;

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
