import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { BoxNowShippingProvider, resetBoxNowTokenCache } from "./boxnow";
import type { ShippingMethod } from "./types";

const lockerMethod: ShippingMethod = {
  id: "m-boxnow",
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
};

/**
 * The stage 8 exit check: with the env vars empty the app still builds and
 * the provider returns a clean "not configured" result. These assert that
 * rather than taking it on trust, because the BOX NOW account genuinely does
 * not exist yet and this is the state the site will ship in.
 */
describe("BOX NOW provider with no credentials", () => {
  const saved = {
    url: process.env.BOXNOW_API_URL,
    id: process.env.BOXNOW_CLIENT_ID,
    secret: process.env.BOXNOW_CLIENT_SECRET,
  };

  beforeEach(() => {
    delete process.env.BOXNOW_API_URL;
    delete process.env.BOXNOW_CLIENT_ID;
    delete process.env.BOXNOW_CLIENT_SECRET;
    resetBoxNowTokenCache();
  });

  afterEach(() => {
    if (saved.url) process.env.BOXNOW_API_URL = saved.url;
    if (saved.id) process.env.BOXNOW_CLIENT_ID = saved.id;
    if (saved.secret) process.env.BOXNOW_CLIENT_SECRET = saved.secret;
  });

  it("constructs without throwing", () => {
    expect(() => new BoxNowShippingProvider([lockerMethod])).not.toThrow();
  });

  it("still quotes, because rates come from our own table not their API", async () => {
    const provider = new BoxNowShippingProvider([lockerMethod]);
    const result = await provider.quote(
      { subtotalCents: 1000, totalWeightGrams: 100 },
      { countryCode: "CY" },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toHaveLength(1);
      expect(result.data[0]!.priceCents).toBe(300);
    }
  });

  it("refuses to create a shipment, with not-configured rather than a crash", async () => {
    const provider = new BoxNowShippingProvider([lockerMethod]);
    const result = await provider.createShipment({
      orderNumber: "CY-2608-0001",
      totalCents: 1300,
      collectOnDeliveryCents: null,
      destination: { countryCode: "CY", lockerId: "locker-1" },
      recipient: { name: "Test", phone: "+35799123456", email: "a@b.cy" },
      items: [{ title: "dragon", quantity: 1 }],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("not-configured");
      expect(result.error.message).not.toMatch(/undefined|null|error/i);
    }
  });

  it("refuses a label and tracking the same way", async () => {
    const provider = new BoxNowShippingProvider([lockerMethod]);
    const label = await provider.getLabel("parcel-1");
    const tracked = await provider.track("parcel-1");

    expect(label.ok).toBe(false);
    expect(tracked.ok).toBe(false);
    if (!label.ok) expect(label.error.code).toBe("not-configured");
    if (!tracked.ok) expect(tracked.error.code).toBe("not-configured");
  });

  it("gives a message a buyer could actually read", async () => {
    const provider = new BoxNowShippingProvider([lockerMethod]);
    const result = await provider.getLabel("parcel-1");
    if (!result.ok) {
      expect(result.error.message).toContain("not set up yet");
      // No em dashes anywhere in buyer facing copy, per CLAUDE.md section 4.
      expect(result.error.message).not.toMatch(/[—–]/);
    }
  });
});

describe("BOX NOW provider with credentials but no locker chosen", () => {
  beforeEach(() => {
    process.env.BOXNOW_API_URL = "https://example.invalid";
    process.env.BOXNOW_CLIENT_ID = "id";
    process.env.BOXNOW_CLIENT_SECRET = "secret";
    resetBoxNowTokenCache();
  });

  afterEach(() => {
    delete process.env.BOXNOW_API_URL;
    delete process.env.BOXNOW_CLIENT_ID;
    delete process.env.BOXNOW_CLIENT_SECRET;
    resetBoxNowTokenCache();
  });

  it("asks for a locker before it tries to reach the network", async () => {
    const provider = new BoxNowShippingProvider([lockerMethod]);
    const result = await provider.createShipment({
      orderNumber: "CY-2608-0002",
      totalCents: 1300,
      collectOnDeliveryCents: null,
      destination: { countryCode: "CY", lockerId: null },
      recipient: { name: "Test", phone: "+35799123456", email: "a@b.cy" },
      items: [{ title: "dragon", quantity: 1 }],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("invalid-input");
      expect(result.error.message).toBe("Pick a BOX NOW locker first.");
    }
  });
});
