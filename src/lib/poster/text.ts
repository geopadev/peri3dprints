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

/**
 * Wrap a paragraph that may already carry its own line breaks. The owner
 * typed those breaks on purpose, so they are kept and each piece is wrapped
 * inside them rather than the whole thing being reflowed into one river.
 */
export function layoutParagraph(
  text: string,
  maxWidth: number,
  fontPx: number,
  measure: Measure,
): string[] {
  return text
    .split(/\r?\n/)
    .flatMap((segment) => (segment.trim() ? wrapLines(segment, maxWidth, fontPx, measure) : []));
}

function largestThatFits(
  text: string,
  maxWidth: number,
  startPx: number,
  minPx: number,
  maxLines: number,
  measure: Measure,
): { fontPx: number; lines: string[] } | null {
  const step = Math.max(1, Math.round(startPx * 0.02));
  for (let fontPx = startPx; fontPx >= minPx; fontPx -= step) {
    const lines = layoutParagraph(text, maxWidth, fontPx, measure);
    if (lines.length <= maxLines && lines.every((line) => measure(line, fontPx) <= maxWidth)) {
      return { fontPx, lines };
    }
  }
  return null;
}

/**
 * fitLines, but respecting the breaks the owner typed.
 *
 * It tries twice. The first pass insists that every typed line stays one line
 * on the paper, shrinking the type to buy that. Only if even the smallest
 * size cannot manage does it allow a typed line to wrap.
 *
 * The two passes exist because one pass stopped shrinking the moment it was
 * inside the line budget, which left "Missed something? It is all online."
 * broken after "all" with "online." orphaned underneath. Slightly smaller
 * type reads better on a sign than a stranded word.
 */
export function fitParagraph(
  text: string,
  maxWidth: number,
  startPx: number,
  minPx: number,
  maxLines: number,
  measure: Measure,
): { fontPx: number; lines: string[] } {
  const typed = text.split(/\r?\n/).filter((line) => line.trim()).length;

  if (typed > 0 && typed <= maxLines) {
    const unwrapped = largestThatFits(text, maxWidth, startPx, minPx, typed, measure);
    if (unwrapped) return unwrapped;
  }

  return (
    largestThatFits(text, maxWidth, startPx, minPx, maxLines, measure) ?? {
      fontPx: minPx,
      lines: layoutParagraph(text, maxWidth, minPx, measure),
    }
  );
}
