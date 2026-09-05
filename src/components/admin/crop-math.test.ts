import { describe, expect, it } from "vitest";
import { centred, clampCrop, MAX_ZOOM, zoomAt } from "./crop-math";

describe("centred", () => {
  it("takes the biggest square from the middle of a landscape photo", () => {
    expect(centred(4000, 3000)).toEqual({ x: 500, y: 0, size: 3000 });
  });
  it("and of a portrait one", () => {
    expect(centred(3000, 4000)).toEqual({ x: 0, y: 500, size: 3000 });
  });
});

describe("clampCrop", () => {
  it("keeps the square inside the photo", () => {
    expect(clampCrop({ x: -50, y: 1100, size: 1000 }, 3000, 2000)).toEqual({ x: 0, y: 1000, size: 1000 });
    expect(clampCrop({ x: 2500, y: -1, size: 1000 }, 3000, 2000)).toEqual({ x: 2000, y: 0, size: 1000 });
  });
  it("never zooms out past the photo or in past the limit", () => {
    expect(clampCrop({ x: 0, y: 0, size: 9999 }, 3000, 2000).size).toBe(2000);
    expect(clampCrop({ x: 0, y: 0, size: 1 }, 3000, 2000).size).toBe(2000 / MAX_ZOOM);
  });
});

describe("zoomAt", () => {
  const w = 4000;
  const h = 3000;

  it("keeps the point under the finger where it was", () => {
    const before = centred(w, h);
    // A third of the way across and down the frame.
    const anchorX = 1 / 3;
    const anchorY = 1 / 3;
    const pointBefore = {
      x: before.x + anchorX * before.size,
      y: before.y + anchorY * before.size,
    };
    const after = zoomAt(before, 2, anchorX, anchorY, w, h);
    expect(after.size).toBe(before.size / 2);
    expect(after.x + anchorX * after.size).toBeCloseTo(pointBefore.x, 6);
    expect(after.y + anchorY * after.size).toBeCloseTo(pointBefore.y, 6);
  });

  it("zooming back out returns to where it started", () => {
    const start = centred(w, h);
    const there = zoomAt(start, 3, 0.8, 0.2, w, h);
    const back = zoomAt(there, 1 / 3, 0.8, 0.2, w, h);
    expect(back.size).toBeCloseTo(start.size, 6);
    expect(back.x).toBeCloseTo(start.x, 6);
    expect(back.y).toBeCloseTo(start.y, 6);
  });

  it("is clamped when the anchor would push the square off the edge", () => {
    // Zooming in on the far corner from fully zoomed out must slide the square
    // back inside rather than leave a strip of nothing.
    const after = zoomAt(centred(w, h), 1.5, 1, 1, w, h);
    expect(after.x + after.size).toBeLessThanOrEqual(w);
    expect(after.y + after.size).toBeLessThanOrEqual(h);
    expect(after.x).toBeGreaterThanOrEqual(0);
    expect(after.y).toBeGreaterThanOrEqual(0);
  });

  it("the slider zoom, anchored at the centre, keeps the centre", () => {
    const start = { x: 1000, y: 500, size: 1500 };
    const after = zoomAt(start, 2, 0.5, 0.5, w, h);
    expect(after.x + after.size / 2).toBeCloseTo(start.x + start.size / 2, 6);
    expect(after.y + after.size / 2).toBeCloseTo(start.y + start.size / 2, 6);
  });
});
