import { describe, expect, it } from "vitest";
import { quoteForMethod, rateShipping, resolveZone } from "./rates";
import type { ShippingMethod } from "./types";

function method(overrides: Partial<ShippingMethod> = {}): ShippingMethod {
  return {
    id: "m1",
    code: "cypost-cy",
    carrier: "cypost",
    zone: "cy",
    label: "Cyprus Post",
    description: null,
    baseCents: 250,
    perExtra100gCents: 40,
    freeOverCents: 3000,
    maxWeightGrams: 2000,
    requiresLocker: false,
    supportsCod: false,
    ...overrides,
  };
}

describe("resolveZone", () => {
  it("puts Cyprus in its own zone", () => {
    expect(resolveZone("CY")).toBe("cy");
  });

  it("is case and whitespace insensitive", () => {
    expect(resolveZone(" cy ")).toBe("cy");
    expect(resolveZone("de")).toBe("eu");
  });

  it("maps EU member states to eu", () => {
    for (const code of ["DE", "FR", "IE", "MT", "SE", "PT"]) {
      expect(resolveZone(code)).toBe("eu");
    }
  });

  it("maps everything else to world", () => {
    for (const code of ["GB", "US", "AU", "CH", "TR", "JP"]) {
      expect(resolveZone(code)).toBe("world");
    }
  });

  it("does not treat the UK as EU", () => {
    expect(resolveZone("GB")).toBe("world");
  });
});

describe("quoteForMethod weight tiers", () => {
  const cheap = method({ freeOverCents: null });

  it("charges base only inside the included weight", () => {
    expect(quoteForMethod(cheap, { subtotalCents: 500, totalWeightGrams: 500 }).priceCents).toBe(
      250,
    );
    expect(quoteForMethod(cheap, { subtotalCents: 500, totalWeightGrams: 120 }).priceCents).toBe(
      250,
    );
  });

  it("rounds a part-used tier up to a whole step", () => {
    // 501g is 1g over, and still costs a full 100g step.
    expect(quoteForMethod(cheap, { subtotalCents: 500, totalWeightGrams: 501 }).priceCents).toBe(
      290,
    );
    expect(quoteForMethod(cheap, { subtotalCents: 500, totalWeightGrams: 600 }).priceCents).toBe(
      290,
    );
    expect(quoteForMethod(cheap, { subtotalCents: 500, totalWeightGrams: 601 }).priceCents).toBe(
      330,
    );
  });

  it("scales across several tiers", () => {
    // 1500g is 1000g over, so ten steps of 40.
    expect(quoteForMethod(cheap, { subtotalCents: 500, totalWeightGrams: 1500 }).priceCents).toBe(
      650,
    );
  });

  it("never goes below the base for a weightless order", () => {
    expect(quoteForMethod(cheap, { subtotalCents: 500, totalWeightGrams: 0 }).priceCents).toBe(250);
  });
});

describe("free shipping threshold", () => {
  it("is not free below the threshold", () => {
    const quote = quoteForMethod(method(), { subtotalCents: 2999, totalWeightGrams: 1500 });
    expect(quote.free).toBe(false);
    expect(quote.priceCents).toBe(650);
  });

  it("is free exactly at the threshold", () => {
    const quote = quoteForMethod(method(), { subtotalCents: 3000, totalWeightGrams: 1500 });
    expect(quote.free).toBe(true);
    expect(quote.priceCents).toBe(0);
  });

  it("is free above the threshold, however heavy", () => {
    const quote = quoteForMethod(method(), { subtotalCents: 9000, totalWeightGrams: 1900 });
    expect(quote.priceCents).toBe(0);
  });

  it("never goes free when the method has no threshold", () => {
    const quote = quoteForMethod(method({ freeOverCents: null }), {
      subtotalCents: 100000,
      totalWeightGrams: 100,
    });
    expect(quote.free).toBe(false);
    expect(quote.priceCents).toBe(250);
  });
});

describe("method exclusion", () => {
  it("excludes a method the parcel is too heavy for, and says so", () => {
    const post = method({ maxWeightGrams: 2000, label: "Cyprus Post" });
    const result = rateShipping([post], { subtotalCents: 1000, totalWeightGrams: 2500 }, "CY");

    expect(result.quotes).toHaveLength(0);
    expect(result.excluded).toHaveLength(1);
    expect(result.excluded[0]!.reason).toBe("too-heavy");
    expect(result.excluded[0]!.message).toContain("2 kg");
  });

  it("keeps a method exactly at its weight limit", () => {
    const post = method({ maxWeightGrams: 2000 });
    const result = rateShipping([post], { subtotalCents: 1000, totalWeightGrams: 2000 }, "CY");
    expect(result.quotes).toHaveLength(1);
  });

  it("treats a null weight limit as unlimited", () => {
    const pickup = method({ maxWeightGrams: null, code: "pickup-festival" });
    const result = rateShipping([pickup], { subtotalCents: 1000, totalWeightGrams: 50000 }, "CY");
    expect(result.quotes).toHaveLength(1);
  });

  it("excludes methods for the wrong zone", () => {
    const cyOnly = method({ zone: "cy", label: "BOX NOW locker" });
    const result = rateShipping([cyOnly], { subtotalCents: 1000, totalWeightGrams: 100 }, "DE");

    expect(result.zone).toBe("eu");
    expect(result.quotes).toHaveLength(0);
    expect(result.excluded[0]!.reason).toBe("wrong-zone");
  });
});

describe("rateShipping overall", () => {
  it("returns only the matching zone's methods, cheapest first", () => {
    const methods = [
      method({ id: "a", code: "acs-cy-home", zone: "cy", baseCents: 450, freeOverCents: null }),
      method({ id: "b", code: "boxnow-cy", zone: "cy", baseCents: 300, freeOverCents: null }),
      method({ id: "c", code: "cypost-eu", zone: "eu", baseCents: 900, freeOverCents: null }),
    ];

    const result = rateShipping(methods, { subtotalCents: 1000, totalWeightGrams: 100 }, "CY");

    expect(result.quotes.map((q) => q.method.id)).toEqual(["b", "a"]);
    expect(result.excluded.map((e) => e.method.id)).toEqual(["c"]);
  });

  it("puts a free method at the top", () => {
    const methods = [
      method({ id: "cheap", baseCents: 250, freeOverCents: null }),
      method({ id: "free-over", baseCents: 450, freeOverCents: 3000 }),
    ];

    const result = rateShipping(methods, { subtotalCents: 5000, totalWeightGrams: 100 }, "CY");

    expect(result.quotes[0]!.method.id).toBe("free-over");
    expect(result.quotes[0]!.priceCents).toBe(0);
  });

  it("returns no quotes at all rather than throwing when nothing fits", () => {
    const result = rateShipping([], { subtotalCents: 1000, totalWeightGrams: 100 }, "CY");
    expect(result.quotes).toEqual([]);
    expect(result.excluded).toEqual([]);
    expect(result.zone).toBe("cy");
  });
});
