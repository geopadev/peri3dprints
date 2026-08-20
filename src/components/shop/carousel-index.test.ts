import { describe, expect, it } from "vitest";
import { nextIndex, slotOffset } from "./carousel-index";

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

describe("slotOffset", () => {
  it("puts the current card in front", () => {
    expect(slotOffset(2, 2, 5)).toBe(0);
  });

  it("puts its neighbours either side", () => {
    expect(slotOffset(1, 2, 5)).toBe(-1);
    expect(slotOffset(3, 2, 5)).toBe(1);
  });

  it("wraps the short way round, so the last card is left of the first", () => {
    expect(slotOffset(4, 0, 5)).toBe(-1);
    expect(slotOffset(0, 4, 5)).toBe(1);
  });

  it("pushes anything further out off stage", () => {
    expect(Math.abs(slotOffset(3, 0, 7))).toBeGreaterThan(1);
  });

  it("handles a single category without wrapping onto itself", () => {
    expect(slotOffset(0, 0, 1)).toBe(0);
  });

  it("survives no categories", () => {
    expect(slotOffset(0, 0, 0)).toBe(0);
  });
});
