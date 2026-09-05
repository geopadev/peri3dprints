/** Paper the owner can actually get printed in Cyprus, portrait, in millimetres. */
export const POSTER_SIZES = {
  a4: { label: "A4", widthMm: 210, heightMm: 297 },
  a5: { label: "A5", widthMm: 148, heightMm: 210 },
  a6: { label: "A6", widthMm: 105, heightMm: 148 },
} as const;

export type PosterSizeId = keyof typeof POSTER_SIZES;
export type PosterSize = (typeof POSTER_SIZES)[PosterSizeId];

/** What goes in the PDF. 300 is what a print shop expects. */
export const PRINT_DPI = 300;
/** What the preview draws at. Same drawing code, fewer pixels, so a phone can
 *  hold it in memory: an A4 at 300dpi is 8.7 million pixels. */
export const PREVIEW_DPI = 110;

export function mmToPx(mm: number, dpi: number): number {
  return (mm / 25.4) * dpi;
}

/** PDF user space is 72 points to the inch, always. */
export function mmToPt(mm: number): number {
  return (mm / 25.4) * 72;
}
