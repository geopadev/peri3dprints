/**
 * The utility voice from CLAUDE.md section 3: DM Mono, uppercase, 0.08em
 * tracking. Specs, order numbers, tracking codes, chips, tags.
 *
 * DM Mono is loaded at weight 400 only, in layout.tsx. Never combine this with
 * a font-weight utility: the browser will synthesise a fake bold rather than
 * load one, and it looks it.
 */
export const UTILITY_TEXT = "font-mono text-xs tracking-utility uppercase";
