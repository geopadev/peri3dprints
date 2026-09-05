import { supabaseUrl } from "@/lib/supabase/config";

export const PRODUCT_IMAGES_BUCKET = "product-images";

/**
 * Public URL for an object in the product-images bucket. The bucket is public,
 * so this needs no signing.
 *
 * This used to ask Supabase to resize the image, which returned 403
 * FeatureNotEnabled on every request: image transforms are a paid Supabase
 * feature and this project is on the free plan, so every product photo on the
 * site was broken.
 *
 * Nothing was lost by dropping it. Every place that renders one of these goes
 * through next/image, which resizes and re-encodes on its own from the `sizes`
 * it is already given, so the resizing still happens, just one layer up. The
 * two callers that are not next/image, the Open Graph tag and the JSON-LD
 * product image, want the full size original anyway.
 */
export function productImageUrl(storagePath: string): string {
  const base = supabaseUrl().replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/${storagePath}`;
}
