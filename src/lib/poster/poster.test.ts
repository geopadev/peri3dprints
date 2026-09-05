import { describe, expect, it } from "vitest";
import jsQR from "jsqr";
import { fitModuleScale, qrPixels, qrPixelSize, QUIET_MODULES } from "./qr-pixels";
import { qrMatrix } from "./qr";
import { posterUrl } from "./copy";
import { fitLines, fitParagraph, layoutParagraph, wrapLines } from "./text";
import { mmToPt, mmToPx } from "./sizes";

/**
 * The point of these: a poster gets printed fifty times and taken to a
 * market. Believing the code is right is not the same as knowing it scans, so
 * the buffer that goes on the paper is decoded back here by a different
 * library than the one that made it.
 */
describe("the printed code scans", () => {
  const cases = [
    "https://peri3dprints.vercel.app/?s=stall",
    "https://peri3dprints.com/?s=stall",
    "https://peri3dprints.com",
    // A long one, which forces a bigger symbol and smaller modules.
    "https://a-rather-longer-domain-than-he-will-ever-use.example.com/?s=stall",
  ];

  for (const url of cases) {
    it(`round trips ${url}`, () => {
      const matrix = qrMatrix(url);
      const scale = fitModuleScale(matrix, 1200);
      const pixels = qrPixels(matrix, scale);
      const decoded = jsQR(pixels.data, pixels.width, pixels.height);
      expect(decoded?.data).toBe(url);
    });
  }

  it("still scans at the smallest module the fitter will pick", () => {
    const url = "https://peri3dprints.vercel.app/?s=stall";
    const matrix = qrMatrix(url);
    const pixels = qrPixels(matrix, 1);
    expect(jsQR(pixels.data, pixels.width, pixels.height)?.data).toBe(url);
  });

  it("keeps the quiet zone, which is what scanners need to find the edge", () => {
    const matrix = qrMatrix("https://example.com");
    const scale = 4;
    const pixels = qrPixels(matrix, scale);
    const border = QUIET_MODULES * scale;
    // Every pixel in the top border row and the left border column is white.
    for (let x = 0; x < pixels.width; x++) {
      expect(pixels.data[(0 * pixels.width + x) * 4]).toBe(255);
      expect(pixels.data[((border - 1) * pixels.width + x) * 4]).toBe(255);
    }
    for (let y = 0; y < pixels.height; y++) {
      expect(pixels.data[(y * pixels.width + border - 1) * 4]).toBe(255);
    }
  });
});

describe("fitModuleScale", () => {
  it("never rounds up past the space available", () => {
    const matrix = qrMatrix("https://example.com");
    for (const target of [100, 237, 500, 1013]) {
      const scale = fitModuleScale(matrix, target);
      expect(qrPixelSize(matrix, scale)).toBeLessThanOrEqual(target);
      expect(Number.isInteger(scale)).toBe(true);
    }
  });

  it("never returns zero, however little room there is", () => {
    expect(fitModuleScale(qrMatrix("https://example.com"), 1)).toBe(1);
  });
});

describe("posterUrl", () => {
  it("adds the stall marker", () => {
    expect(posterUrl("https://peri3dprints.com", true)).toBe("https://peri3dprints.com/?s=stall");
  });
  it("does not double the slash on an origin that has one", () => {
    expect(posterUrl("https://peri3dprints.com/", true)).toBe("https://peri3dprints.com/?s=stall");
  });
  it("leaves the link alone when the marker is off", () => {
    expect(posterUrl("https://peri3dprints.com/", false)).toBe("https://peri3dprints.com");
  });
});

/** 10px a character, so the sums are checkable by hand. */
const measure = (text: string, fontPx: number) => text.length * fontPx * 0.5;

describe("wrapLines", () => {
  it("breaks on words, never mid word", () => {
    const lines = wrapLines("Scan to see everything I print", 100, 10, measure);
    expect(lines.every((line) => !line.startsWith(" "))).toBe(true);
    expect(lines.join(" ")).toBe("Scan to see everything I print");
  });

  it("leaves a single unbreakable word alone rather than chopping it", () => {
    expect(wrapLines("Supercalifragilistic", 10, 10, measure)).toEqual(["Supercalifragilistic"]);
  });

  it("has nothing to say about an empty line", () => {
    expect(wrapLines("   ", 100, 10, measure)).toEqual([]);
  });
});

describe("fitLines", () => {
  it("keeps the big size when the line already fits", () => {
    const { fontPx, lines } = fitLines("Short", 500, 60, 20, 3, measure);
    expect(fontPx).toBe(60);
    expect(lines).toEqual(["Short"]);
  });

  it("shrinks a long line until it is inside the paper", () => {
    const text = "More prints than fit on this table and then some more besides";
    const { fontPx, lines } = fitLines(text, 300, 60, 12, 3, measure);
    expect(fontPx).toBeLessThan(60);
    expect(lines.length).toBeLessThanOrEqual(3);
    for (const line of lines) expect(measure(line, fontPx)).toBeLessThanOrEqual(300);
  });

  it("stops at the floor rather than shrinking to nothing", () => {
    const { fontPx, lines } = fitLines("x".repeat(400), 50, 60, 12, 2, measure);
    expect(fontPx).toBe(12);
    expect(lines.length).toBeGreaterThan(0);
  });
});

describe("paper maths", () => {
  it("puts A4 at the size a print shop expects", () => {
    expect(Math.round(mmToPx(210, 300))).toBe(2480);
    expect(Math.round(mmToPx(297, 300))).toBe(3508);
  });
  it("converts to points for the pdf", () => {
    expect(mmToPt(210)).toBeCloseTo(595.28, 1);
    expect(mmToPt(297)).toBeCloseTo(841.89, 1);
  });
});

describe("layoutParagraph", () => {
  it("keeps the line breaks the owner typed", () => {
    const lines = layoutParagraph("Missed something? It is all online.\nScan to view my website!", 1000, 10, measure);
    expect(lines).toEqual(["Missed something? It is all online.", "Scan to view my website!"]);
  });

  it("wraps inside a typed line rather than across it", () => {
    // 5px a character here, so 20 wide fits four: each typed line has to split.
    const lines = layoutParagraph("aaa bbb\nccc ddd", 20, 10, measure);
    expect(lines).toEqual(["aaa", "bbb", "ccc", "ddd"]);
  });

  it("drops a blank line rather than leaving a gap on the paper", () => {
    expect(layoutParagraph("one\n\n\ntwo", 1000, 10, measure)).toEqual(["one", "two"]);
  });
});

describe("fitParagraph", () => {
  it("shrinks until every typed line fits", () => {
    const text = "Έχασες κάτι; Είναι όλα online.\nΣκάναρε για να δεις την ιστοσελίδα μου!";
    const { fontPx, lines } = fitParagraph(text, 300, 40, 10, 4, measure);
    expect(lines.length).toBeLessThanOrEqual(4);
    for (const line of lines) expect(measure(line, fontPx)).toBeLessThanOrEqual(300);
  });

  it("counts the typed breaks against the line budget", () => {
    // Four short typed lines already fill a four line budget at any size.
    const { lines } = fitParagraph("a\nb\nc\nd", 1000, 40, 10, 4, measure);
    expect(lines).toEqual(["a", "b", "c", "d"]);
  });
});

describe("the default wording", () => {
  it("carries all three languages and a break in each", async () => {
    const { DEFAULT_TEXT } = await import("./copy");
    for (const [language, value] of Object.entries(DEFAULT_TEXT)) {
      expect(value.split("\n").length, language).toBe(2);
    }
  });

  it("uses the Greek question mark, not the Latin one", async () => {
    const { DEFAULT_TEXT } = await import("./copy");
    expect(DEFAULT_TEXT.greek).toContain(";");
    expect(DEFAULT_TEXT.greek).not.toContain("?");
  });

  it("is actually in the script it claims", async () => {
    const { DEFAULT_TEXT } = await import("./copy");
    expect(DEFAULT_TEXT.greek).toMatch(/[\u0370-\u03ff]/);
    expect(DEFAULT_TEXT.hebrew).toMatch(/[\u0590-\u05ff]/);
    expect(DEFAULT_TEXT.english).not.toMatch(/[\u0370-\u03ff\u0590-\u05ff]/);
  });
});

describe("fitParagraph keeps typed lines whole", () => {
  it("shrinks rather than orphaning a word off the end of a typed line", () => {
    // Wide enough for the sentence at 20px but not at 40px. One pass would
    // have stopped at 40 and wrapped; two passes shrink and keep it whole.
    const text = "Missed something? It is all online.\nScan to view my website!";
    const width = measure("Missed something? It is all online.", 20);
    const { fontPx, lines } = fitParagraph(text, width, 40, 8, 4, measure);
    expect(lines).toEqual(["Missed something? It is all online.", "Scan to view my website!"]);
    expect(fontPx).toBeLessThanOrEqual(20);
  });

  it("still wraps when even the smallest type cannot keep a line whole", () => {
    const { lines } = fitParagraph("aaa bbb ccc ddd eee", 20, 40, 10, 4, measure);
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.join(" ")).toBe("aaa bbb ccc ddd eee");
  });
});
