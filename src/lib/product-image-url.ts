import { supabaseUrl } from "@/lib/supabase/config";

export const PRODUCT_IMAGES_BUCKET = "product-images";

/**
 * Public URL for an object in the product-images bucket, optionally through
 * Supabase image transforms. The bucket is public, so this needs no signing.
 *
 * CLAUDE.md section 8 wants images served at a sensible size rather than full
 * resolution, which is what `width` does here.
 */
export function productImageUrl(storagePath: string, width?: number): string {
  const base = supabaseUrl().replace(/\/$/, "");

  if (width) {
    const params = new URLSearchParams({
      width: String(width),
      resize: "contain",
      quality: "80",
    });
    return `${base}/storage/v1/render/image/public/${PRODUCT_IMAGES_BUCKET}/${storagePath}?${params}`;
  }

  return `${base}/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/${storagePath}`;
}
