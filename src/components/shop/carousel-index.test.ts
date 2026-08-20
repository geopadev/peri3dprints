import { describe, expect, it } from "vitest";
import { nextIndex } from "./carousel-index";

describe("nextIndex", () => {
  it("steps forward", () => {
    expect(nextIndex(0, 1, 4)).toBe(1);
    expect(nextIndex(2, 1, 4)).toBe(3);
  });

  it("wraps past the end", () => {
    expect(nextIndex(3, 1, 4)).toBe(0);
  });

  it("wraps backwards past the start", () => {
    expect(nextIndex(0, -1, 4)).toBe(3);
  });

  it("never returns a negative index", () => {
    for (let i = 0; i < 4; i++) {
      expect(nextIndex(i, -1, 4)).toBeGreaterThanOrEqual(0);
    }
  });

  it("stays put when there is only one category", () => {
    expect(nextIndex(0, 1, 1)).toBe(0);
    expect(nextIndex(0, -1, 1)).toBe(0);
  });

  it("survives no categories rather than dividing by zero", () => {
    expect(nextIndex(0, 1, 0)).toBe(0);
  });
});
