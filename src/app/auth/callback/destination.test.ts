import { describe, expect, it } from "vitest";
import { destinationFrom } from "./destination";

const ORIGIN = "https://peri3dprints.vercel.app";

describe("destinationFrom", () => {
  it("returns the path and query from a same-origin absolute URL", () => {
    expect(destinationFrom(`${ORIGIN}/ask-to-buy`, ORIGIN)).toBe("/ask-to-buy");
    expect(destinationFrom(`${ORIGIN}/shop?sort=price`, ORIGIN)).toBe("/shop?sort=price");
  });

  it("falls back to / when nothing was passed", () => {
    expect(destinationFrom(null, ORIGIN)).toBe("/");
  });

  it("refuses a different origin, so an attacker cannot use redirect_to to send a real user off-site", () => {
    expect(destinationFrom("https://evil.example/phish", ORIGIN)).toBe("/");
  });

  it("refuses a protocol-relative host pretending to be a path", () => {
    expect(destinationFrom("https://peri3dprints.vercel.app//evil.example", ORIGIN)).toBe("/");
  });

  it("treats a bare garbage string as a same-origin path rather than throwing", () => {
    // The URL constructor resolves this against origin rather than rejecting
    // it, same as a browser would for a relative href. It stays on our own
    // origin either way, which is the property that actually matters here.
    expect(destinationFrom("not a url at all", ORIGIN)).toBe("/not%20a%20url%20at%20all");
  });

  it("falls back to / when the value cannot be parsed as a URL at all", () => {
    expect(destinationFrom("http://", ORIGIN)).toBe("/");
  });
});
