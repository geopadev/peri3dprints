/**
 * Text fitting for the poster, with measurement injected so it can be tested
 * without a canvas. The owner types his own line, and a line that runs off the
 * paper is not something he can see until it is printed.
 */
export type Measure = (text: string, fontPx: number) => number;

/** Greedy wrap. A single word longer than the line is left alone: shrinking
 *  handles it, and breaking a word mid-letter reads as a bug. */
export function wrapLines(
  text: string,
  maxWidth: number,
  fontPx: number,
  measure: Measure,
): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const lines: string[] = [];
  let line = words[0]!;

  for (const word of words.slice(1)) {
    const candidate = `${line} ${word}`;
    if (measure(candidate, fontPx) <= maxWidth) {
      line = candidate;
    } else {
      lines.push(line);
      line = word;
    }
  }
  lines.push(line);
  return lines;
}

/**
 * The biggest size at or below `startPx` that wraps into at most `maxLines`
 * and stays inside `maxWidth`. Steps down a point at a time rather than
 * solving it, because measurement is not linear once wrapping changes.
 */
export function fitLines(
  text: string,
  maxWidth: number,
  startPx: number,
  minPx: number,
  maxLines: number,
  measure: Measure,
): { fontPx: number; lines: string[] } {
  let fontPx = startPx;

  while (fontPx > minPx) {
    const lines = wrapLines(text, maxWidth, fontPx, measure);
    const fits =
      lines.length <= maxLines && lines.every((line) => measure(line, fontPx) <= maxWidth);
    if (fits) return { fontPx, lines };
    fontPx -= Math.max(1, Math.round(startPx * 0.02));
  }

  // Floor reached. Return what there is rather than nothing: a slightly tight
  // line is recoverable by editing, an empty poster is not.
  return { fontPx: minPx, lines: wrapLines(text, maxWidth, minPx, measure) };
}
