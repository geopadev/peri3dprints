import { describe, expect, it } from "vitest";
import { rateShipping } from "./rates";
import type { ShippingMethod } from "./types";

/**
 * The seven rows actually seeded by 0002_seed.sql, copied from the dev
 * database rather than invented, so these lock in what a real buyer would be
 * quoted. If SETUP.md section 5's rates change, these change with them.
 */
const SEEDED: ShippingMethod[] = [
  {
    id: "1",
    code: "boxnow-cy",
    carrier: "boxnow",
    zone: "cy",
    label: "BOX NOW locker",
    description: null,
    baseCents: 300,
    perExtra100gCents: 0,
    freeOverCents: 3500,
    maxWeightGrams: 20000,
    requiresLocker: true,
    supportsCod: true,
  },
  {
    id: "2",
    code: "acs-cy-home",
    carrier: "acs",
    zone: "cy",
    label: "ACS to your door",
    description: null,
    baseCents: 450,
    perExtra100gCents: 50,
    freeOverCents: 5000,
    maxWeightGrams: 20000,
    requiresLocker: false,
    supportsCod: true,
  },
  {
    id: "3",
    code: "acs-cy-point",
    carrier: "acs",
    zone: "cy",
    label: "ACS pickup point",
    description: null,
    baseCents: 350,
    perExtra100gCents: 50,
    freeOverCents: 4000,
    maxWeightGrams: 20000,
    requiresLocker: false,
    supportsCod: true,
  },
  {
    id: "4",
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
  },
  {
    id: "5",
    code: "cypost-eu",
    carrier: "cypost",
    zone: "eu",
    label: "Post to Europe",
    description: null,
    baseCents: 900,
    perExtra100gCents: 120,
    freeOverCents: null,
    maxWeightGrams: 2000,
    requiresLocker: false,
    supportsCod: false,
  },
  {
    id: "6",
    code: "cypost-world",
    carrier: "cypost",
    zone: "world",
    label: "Post worldwide",
    description: null,
    baseCents: 1400,
    perExtra100gCents: 180,
    freeOverCents: null,
    maxWeightGrams: 2000,
    requiresLocker: false,
    supportsCod: false,
  },
  {
    id: "7",
    code: "pickup-festival",
    carrier: "pickup",
    zone: "cy",
    label: "Collect from me at a market",
    description: null,
    baseCents: 0,
    perExtra100gCents: 0,
    freeOverCents: null,
    maxWeightGrams: null,
    requiresLocker: false,
    supportsCod: false,
  },
];

function codes(result: ReturnType<typeof rateShipping>) {
  return result.quotes.map((q) => [q.method.code, q.priceCents] as const);
}

describe("the real seeded rates", () => {
  it("quotes a light Cyprus order, cheapest first, with collection free", () => {
    const result = rateShipping(SEEDED, { subtotalCents: 1300, totalWeightGrams: 46 }, "CY");
    expect(codes(result)).toEqual([
      ["pickup-festival", 0],
      ["cypost-cy", 250],
      ["boxnow-cy", 300],
      ["acs-cy-point", 350],
      ["acs-cy-home", 450],
    ]);
  });

  it("drops Cyprus Post once the parcel passes its 2 kg limit, but keeps the couriers", () => {
    const result = rateShipping(SEEDED, { subtotalCents: 1300, totalWeightGrams: 2500 }, "CY");
    const offered = result.quotes.map((q) => q.method.code);
    expect(offered).not.toContain("cypost-cy");
    expect(offered).toContain("boxnow-cy");
    expect(result.excluded.find((e) => e.method.code === "cypost-cy")?.reason).toBe("too-heavy");
  });

  it("charges ACS per 100g over the first 500", () => {
    // 1200g is 700g over, so 7 steps of 50 on top of 450.
    const result = rateShipping(SEEDED, { subtotalCents: 1000, totalWeightGrams: 1200 }, "CY");
    const acs = result.quotes.find((q) => q.method.code === "acs-cy-home");
    expect(acs?.priceCents).toBe(800);
  });

  it("makes BOX NOW free over 35 euro but leaves ACS charging until 50", () => {
    const result = rateShipping(SEEDED, { subtotalCents: 3500, totalWeightGrams: 100 }, "CY");
    expect(result.quotes.find((q) => q.method.code === "boxnow-cy")?.priceCents).toBe(0);
    expect(result.quotes.find((q) => q.method.code === "acs-cy-home")?.priceCents).toBe(450);
  });

  it("offers only Cyprus Post to Germany, and never a Cyprus courier", () => {
    const result = rateShipping(SEEDED, { subtotalCents: 1300, totalWeightGrams: 100 }, "DE");
    expect(result.zone).toBe("eu");
    expect(codes(result)).toEqual([["cypost-eu", 900]]);
  });

  it("offers only worldwide post to the United States", () => {
    const result = rateShipping(SEEDED, { subtotalCents: 1300, totalWeightGrams: 100 }, "US");
    expect(result.zone).toBe("world");
    expect(codes(result)).toEqual([["cypost-world", 1400]]);
  });

  it("leaves an international buyer with nothing when the parcel is too heavy to post", () => {
    const result = rateShipping(SEEDED, { subtotalCents: 1300, totalWeightGrams: 3000 }, "US");
    expect(result.quotes).toEqual([]);
    expect(result.excluded.find((e) => e.method.code === "cypost-world")?.reason).toBe("too-heavy");
  });

  it("still lets someone collect a very heavy order in person", () => {
    const result = rateShipping(SEEDED, { subtotalCents: 1300, totalWeightGrams: 50000 }, "CY");
    expect(codes(result)).toEqual([["pickup-festival", 0]]);
  });
});
