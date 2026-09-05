import QRCode from "qrcode";
import type { QrMatrix } from "./qr-pixels";

/**
 * Level H, 30% recoverable. A poster on a market table gets rained on, bent,
 * thumbed and taped over a corner, and a code that stops scanning halfway
 * through a Saturday is worse than no code: people try it, it fails, and they
 * put their phone away.
 */
export const ERROR_CORRECTION = "H" as const;

export function qrMatrix(text: string): QrMatrix {
  const created = QRCode.create(text, { errorCorrectionLevel: ERROR_CORRECTION });
  const { size, data } = created.modules;
  return { size, modules: Array.from(data, (bit) => bit === 1) };
}
