import type { PosterBlock } from "./draw";
import type { PosterLanguage } from "./copy";

/**
 * English leads because it is the one most people at the stall read, and the
 * two translations sit under it a size down. That hierarchy is the whole
 * reason a second face is tolerable: it reads as a translation tier rather
 * than as a font that does not match.
 */
export function posterBlocks(text: Record<PosterLanguage, string>): PosterBlock[] {
  return [
    { text: text.english, face: "display", sizeMm: 11, minSizeMm: 5, weight: "800" },
    { text: text.greek, face: "translations", sizeMm: 7, minSizeMm: 3.4, weight: "700" },
    { text: text.hebrew, face: "translations", sizeMm: 7, minSizeMm: 3.4, weight: "700", rtl: true },
  ];
}
