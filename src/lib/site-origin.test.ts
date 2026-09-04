import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  headers: async () => ({ get: (k: string) => (k === "host" ? "example.test" : null) }),
}));

async function origin(): Promise<string> {
  vi.resetModules();
  const { siteOrigin } = await import("./site-origin");
  return siteOrigin();
}

describe("siteOrigin", () => {
  beforeEach(() => {
    for (const key of [
      "SITE_URL",
      "NEXT_PUBLIC_SITE_URL",
      "VERCEL",
      "VERCEL_URL",
      "VERCEL_PROJECT_PRODUCTION_URL",
    ]) {
      delete process.env[key];
    }
  });

  it("prefers SITE_URL", async () => {
    process.env.SITE_URL = "https://peri3dprints.com";
    await expect(origin()).resolves.toBe("https://peri3dprints.com");
  });

  it("still accepts the old public name, so an existing deployment keeps working", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://old.example";
    await expect(origin()).resolves.toBe("https://old.example");
  });

  it("ignores a stale localhost when running on Vercel", async () => {
    process.env.SITE_URL = "http://localhost:3000";
    process.env.VERCEL = "1";
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "peri3dprints.vercel.app";
    await expect(origin()).resolves.toBe("https://peri3dprints.vercel.app");
  });

  it("keeps localhost when actually running locally", async () => {
    process.env.SITE_URL = "http://localhost:3000";
    await expect(origin()).resolves.toBe("http://localhost:3000");
  });

  it("falls back to the request host when nothing is set", async () => {
    await expect(origin()).resolves.toBe("https://example.test");
  });

  it("strips a trailing slash", async () => {
    process.env.SITE_URL = "https://peri3dprints.com/";
    await expect(origin()).resolves.toBe("https://peri3dprints.com");
  });
});
