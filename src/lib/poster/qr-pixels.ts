/**
 * A QR code as raw pixels, with no canvas involved.
 *
 * Pure on purpose: this is the one part of a poster that has to be exactly
 * right, and a QR that does not scan is a wasted trip to the print shop. The
 * same buffer this returns is what gets blitted onto the poster and what the
 * test feeds to a decoder, so the thing proven to scan is the thing printed.
 */
export type QrMatrix = {
  /** Modules per side, not counting the quiet zone. */
  size: number;
  /** Row major, size * size, true where the module is dark. */
  modules: boolean[];
};

/** Four modules of clear space. Below this, scanners lose the edge. */
export const QUIET_MODULES = 4;

/** Ink rather than pure black, to match the shop. 5.9% luminance against
 *  white, so every scanner still sees a hard edge. */
const INK: [number, number, number] = [0x12, 0x15, 0x1a];

export function qrPixelSize(matrix: QrMatrix, moduleScale: number): number {
  return (matrix.size + QUIET_MODULES * 2) * moduleScale;
}

/**
 * The largest whole-pixel module scale whose code still fits `targetPx`.
 * Whole pixels on purpose: a fractional scale leaves the browser resampling
 * module edges into grey, which is exactly what makes a printed QR fail.
 */
export function fitModuleScale(matrix: QrMatrix, targetPx: number): number {
  const across = matrix.size + QUIET_MODULES * 2;
  return Math.max(1, Math.floor(targetPx / across));
}

export function qrPixels(
  matrix: QrMatrix,
  moduleScale: number,
): { data: Uint8ClampedArray<ArrayBuffer>; width: number; height: number } {
  const across = matrix.size + QUIET_MODULES * 2;
  const width = across * moduleScale;
  // Backed by an explicit ArrayBuffer: the ImageData constructor will not
  // take the ArrayBufferLike that a bare length widens to.
  const data = new Uint8ClampedArray(new ArrayBuffer(width * width * 4)).fill(0xff);

  for (let row = 0; row < matrix.size; row++) {
    for (let column = 0; column < matrix.size; column++) {
      if (!matrix.modules[row * matrix.size + column]) continue;

      const top = (row + QUIET_MODULES) * moduleScale;
      const left = (column + QUIET_MODULES) * moduleScale;

      for (let y = top; y < top + moduleScale; y++) {
        for (let x = left; x < left + moduleScale; x++) {
          const at = (y * width + x) * 4;
          data[at] = INK[0];
          data[at + 1] = INK[1];
          data[at + 2] = INK[2];
        }
      }
    }
  }

  return { data, width, height: width };
}
