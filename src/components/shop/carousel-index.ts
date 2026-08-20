/**
 * Which face the carousel shows next.
 *
 * Pulled out of the component so it can be tested: the component itself needs
 * a browser and a timer, and headless Chrome will not run one, so this is the
 * only part of the rotation that can be verified automatically.
 */
export function nextIndex(current: number, delta: number, count: number): number {
  if (count <= 0) return 0;
  return (((current + delta) % count) + count) % count;
}

/**
 * How far a card sits from the one in front, wrapped the short way round, so
 * the last card counts as one to the left of the first rather than n-1 to the
 * right. That is what makes the row read as a loop instead of a queue.
 *
 * 0 is the card in front, -1 is behind it on the left, 1 behind on the right.
 * Anything further out is off stage.
 */
export function slotOffset(i: number, index: number, count: number): number {
  if (count <= 0) return 0;
  let offset = i - index;
  const half = Math.floor(count / 2);
  if (offset > half) offset -= count;
  if (offset < -half) offset += count;
  return offset;
}
