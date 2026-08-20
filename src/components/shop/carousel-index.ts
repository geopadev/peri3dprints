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
