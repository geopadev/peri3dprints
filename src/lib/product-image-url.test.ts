import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/config", () => ({
  supabaseUrl: () => "https://example.supabase.co",
}));

const { productImageUrl } = await import("./product-image-url");

describe("productImageUrl", () => {
  it("points at the plain public object", () => {
    expect(productImageUrl("abc.jpg")).toBe(
      "https://example.supabase.co/storage/v1/object/public/product-images/abc.jpg",
    );
  });

  /*
    The regression this exists for: the render endpoint is a paid Supabase
    feature, so on the free plan every product photo came back 403 and the shop
    showed empty boxes. next/image does the resizing instead.
  */
  it("never asks for a transform", () => {
    expect(productImageUrl("abc.jpg")).not.toContain("render/image");
  });
});
