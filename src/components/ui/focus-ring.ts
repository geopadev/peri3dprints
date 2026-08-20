/**
 * The one focus treatment for the whole site, from CLAUDE.md section 8:
 * 2px solid cyan, 2px offset. Every interactive element gets this, no exceptions.
 *
 * Known limitation, see the design system report: cyan against paper is 1.96:1
 * and against surface is 2.37:1, so the ring on its own does not clear the 3:1
 * WCAG floor for non-text UI. It reads clearly against the 2px ink border that
 * every control carries (cyan on ink is 7.72:1), which is what makes it usable.
 */
export const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan focus-visible:outline-solid";

/**
 * For a control on a flame, cyan or magenta band, where the cyan ring either
 * vanishes or reads as decoration. Paper clears 3:1 against flame and magenta.
 *
 * Deliberately not used on lime: paper on lime is 1.46:1. The rule is that
 * focusable controls never sit on a lime band, and the one lime band in the
 * shop puts an onAccent (ink) button on it, whose own fill does the separating.
 */
export const FOCUS_RING_ON_ACCENT =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper focus-visible:outline-solid";
