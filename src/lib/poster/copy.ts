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
 * Where the code sends people, when the owner wants scans counted. A
 * separate route rather than a query string, because Vercel's free plan
 * groups page views by path with the query string stripped, so a marker
 * there would have merged into every other homepage visit and counted
 * nothing. See src/app/stall/page.tsx. No cookie either way, so it needs no
 * consent banner.
 */
export const STALL_PATH = "/stall";

export function posterUrl(origin: string, counted: boolean): string {
  const trimmed = origin.trim().replace(/\/+$/, "") || origin.trim();
  return counted ? `${trimmed}${STALL_PATH}` : trimmed;
}
