/**
 * The maths behind the photo cropper, kept apart from the component so it
 * can be tested without a canvas or a pointer. Everything is in source image
 * pixels: the crop is the square of the original that will be kept.
 */
export type Crop = { x: number; y: number; size: number };

/** How far in the owner can zoom, as a multiple of the fully zoomed out square. */
export const MAX_ZOOM = 4;

export function clampCrop(crop: Crop, width: number, height: number): Crop {
  const maxSize = Math.min(width, height);
  const size = Math.min(maxSize, Math.max(maxSize / MAX_ZOOM, crop.size));
  return {
    size,
    x: Math.min(width - size, Math.max(0, crop.x)),
    y: Math.min(height - size, Math.max(0, crop.y)),
  };
}

/** The default: the biggest square there is, in the middle. */
export function centred(width: number, height: number): Crop {
  const size = Math.min(width, height);
  return { x: (width - size) / 2, y: (height - size) / 2, size };
}

/**
 * Zoom by `factor` (above 1 is in) so the source point under `anchor`, given
 * as 0 to 1 across the frame, stays under the finger or the cursor.
 */
export function zoomAt(
  crop: Crop,
  factor: number,
  anchorX: number,
  anchorY: number,
  width: number,
  height: number,
): Crop {
  const size = crop.size / factor;
  const sourceX = crop.x + anchorX * crop.size;
  const sourceY = crop.y + anchorY * crop.size;
  return clampCrop({ size, x: sourceX - anchorX * size, y: sourceY - anchorY * size }, width, height);
}

/**
 * Longest edge of the kept original. It is never served to a buyer, only
 * reopened by the cropper, so it can be larger than the 1600px square the
 * shop shows and a hard zoom still has pixels to work with.
 */
export const ORIGINAL_MAX = 2400;

/** A crop read back from the database, which stores it as loose JSON. */
export function parseCrop(value: unknown): Crop | null {
  if (!value || typeof value !== "object") return null;
  const { x, y, size } = value as Record<string, unknown>;
  if (typeof x !== "number" || typeof y !== "number" || typeof size !== "number") return null;
  if (![x, y, size].every(Number.isFinite) || size <= 0) return null;
  return { x, y, size };
}
