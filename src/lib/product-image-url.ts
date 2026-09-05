import { supabaseUrl } from "@/lib/supabase/config";

export const PRODUCT_IMAGES_BUCKET = "product-images";
export const PRODUCT_VIDEOS_BUCKET = "product-videos";

/**
 * Public URL for an object in a public bucket. No signing needed.
 *
 * Photos go through next/image, which resizes and re-encodes from the `sizes`
 * each caller already gives it. They used to go through Supabase image
 * transforms instead, which is a paid feature: on the free plan every one of
 * those URLs answered 403 and the shop showed empty boxes. Do not bring the
 * render endpoint back.
 */
function publicObjectUrl(bucket: string, storagePath: string): string {
  const base = supabaseUrl().replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${bucket}/${storagePath}`;
}

export function productImageUrl(storagePath: string): string {
  return publicObjectUrl(PRODUCT_IMAGES_BUCKET, storagePath);
}

/** Videos are served as they were uploaded. Nothing resizes them. */
export function productVideoUrl(storagePath: string): string {
  return publicObjectUrl(PRODUCT_VIDEOS_BUCKET, storagePath);
}
