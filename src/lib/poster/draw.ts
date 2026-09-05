import { mmToPx, type PosterSize } from "./sizes";
import { fitModuleScale, qrPixels, qrPixelSize, type QrMatrix } from "./qr-pixels";
import { fitParagraph, type Measure } from "./text";

/** The palette, from CLAUDE.md section 3. Print gets the same colours. */
const INK = "#12151A";
const PAPER = "#E7EAEE";
const SURFACE = "#FFFFFF";

export type PosterFonts = {
  /** Resolved family strings, read off the page so the poster uses the real
   *  loaded faces rather than a name the canvas would silently fall back on. */
  display: string;
  mono: string;
  /*
    Greek and Hebrew. A second face, and not a preference: Bricolage
    Grotesque has no Greek and no Hebrew glyphs at all, so drawing either in
    it produces empty boxes. One face for both translations rather than two,
    so the block below the English reads as a deliberate second tier.
  */
  translations: string;
};

/** One paragraph of the sign, in one language. */
export type PosterBlock = {
  text: string;
  face: keyof PosterFonts;
  /** Height of its type, in mm on an A4, before the sheet scale is applied. */
  sizeMm: number;
  minSizeMm: number;
  weight: string;
  /** Hebrew reads right to left, and the canvas has to be told. */
  rtl?: boolean;
};

export type PosterInput = {
  blocks: PosterBlock[];
  shopName: string;
  /** Shown under the code. The same string the QR encodes. */
  url: string;
  qr: QrMatrix;
  size: PosterSize;
  fonts: PosterFonts;
};

/** Anything drawn here is a plain 2D context, so nothing about this is
 *  browser only except the context itself. */
type Ctx = CanvasRenderingContext2D;

function measureWith(ctx: Ctx, family: string, weight: string): Measure {
  return (text, fontPx) => {
    ctx.font = `${weight} ${fontPx}px ${family}`;
    return ctx.measureText(text).width;
  };
}

/**
 * The hex infill from CLAUDE.md section 3: what the inside of a print looks
 * like. Faint, and only on the paper behind everything, never inside a box.
 */
function drawHexField(ctx: Ctx, width: number, height: number, radius: number) {
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(1, radius * 0.06);

  const stepX = radius * 1.5;
  const stepY = radius * Math.sqrt(3);

  for (let column = 0; stepX * column < width + radius * 2; column++) {
    const cx = column * stepX;
    const offset = column % 2 === 0 ? 0 : stepY / 2;
    for (let row = 0; stepY * row < height + radius * 2; row++) {
      const cy = row * stepY + offset;
      ctx.beginPath();
      for (let corner = 0; corner < 6; corner++) {
        const angle = (Math.PI / 3) * corner;
        const x = cx + radius * Math.cos(angle);
        const y = cy + radius * Math.sin(angle);
        if (corner === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }
  }
  ctx.restore();
}

function roundedRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Corner ticks, the way a build plate drawing is dimensioned. */
function drawTicks(ctx: Ctx, x: number, y: number, w: number, h: number, length: number) {
  ctx.save();
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(1, length * 0.12);
  ctx.lineCap = "square";
  const corners: [number, number, number, number][] = [
    [x, y, 1, 1],
    [x + w, y, -1, 1],
    [x, y + h, 1, -1],
    [x + w, y + h, -1, -1],
  ];
  for (const [cx, cy, sx, sy] of corners) {
    ctx.beginPath();
    ctx.moveTo(cx + sx * length, cy);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx, cy + sy * length);
    ctx.stroke();
  }
  ctx.restore();
}

function drawMonoLine(
  ctx: Ctx,
  text: string,
  centreX: number,
  baseline: number,
  fontPx: number,
  family: string,
  maxWidth: number,
) {
  // DM Mono is loaded at 400 only. Never ask for a weight: the browser
  // synthesises a fake bold and it looks it.
  ctx.font = `${fontPx}px ${family}`;
  ctx.fillStyle = INK;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  // Tracking has to be done by hand: canvas has no letter-spacing everywhere.
  const tracking = fontPx * 0.08;
  const glyphs = [...text];
  const width = glyphs.reduce((total, g) => total + ctx.measureText(g).width + tracking, -tracking);

  if (width > maxWidth) {
    const shrunk = fontPx * (maxWidth / width);
    drawMonoLine(ctx, text, centreX, baseline, shrunk, family, Number.POSITIVE_INFINITY);
    return;
  }

  let x = centreX - width / 2;
  ctx.textAlign = "left";
  for (const glyph of glyphs) {
    ctx.fillText(glyph, x, baseline);
    x += ctx.measureText(glyph).width + tracking;
  }
}

/**
 * The spec sheet poster: paper with the hex infill, an ink frame, the
 * headline in display type, and the code sat on a white card with a hard
 * shadow and corner ticks, the way a part is dimensioned on a drawing.
 *
 * Everything is in millimetres scaled by dpi, so the same call renders the
 * preview and the file and only the pixel count differs.
 */
export function drawPoster(ctx: Ctx, input: PosterInput, dpi: number): void {
  const { size, fonts } = input;
  const width = mmToPx(size.widthMm, dpi);
  const height = mmToPx(size.heightMm, dpi);
  const mm = (value: number) => mmToPx(value, dpi);
  // Everything scales off the sheet, so an A6 is a small A4 rather than an A4
  // with the middle squeezed out.
  const scale = size.widthMm / 210;

  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, width, height);
  drawHexField(ctx, width, height, mm(6 * scale));

  // The frame.
  const margin = mm(10 * scale);
  const frameWidth = mm(1.2 * scale);
  ctx.strokeStyle = INK;
  ctx.lineWidth = frameWidth;
  ctx.strokeRect(margin, margin, width - margin * 2, height - margin * 2);

  const inner = margin + mm(8 * scale);
  const innerWidth = width - inner * 2;

  // Shop name, in the utility voice, with a rule under it.
  const nameSize = mm(4.2 * scale);
  drawMonoLine(ctx, input.shopName.toUpperCase(), width / 2, inner + nameSize, nameSize, fonts.mono, innerWidth);
  ctx.beginPath();
  ctx.moveTo(inner, inner + mm(7 * scale));
  ctx.lineTo(width - inner, inner + mm(7 * scale));
  ctx.lineWidth = mm(0.5 * scale);
  ctx.stroke();

  // The language blocks, stacked. Each one shrinks and wraps inside the
  // paper rather than running off it, and each is measured with its own face
  // because a Greek sentence set in Open Sans is not the width of the English
  // one set in Bricolage.
  let cursor = inner + mm(14 * scale);
  const blockGap = mm(5 * scale);

  for (const block of input.blocks) {
    if (!block.text.trim()) continue;
    const family = fonts[block.face];
    const { fontPx, lines } = fitParagraph(
      block.text,
      innerWidth,
      mm(block.sizeMm * scale),
      mm(block.minSizeMm * scale),
      4,
      measureWith(ctx, family, block.weight),
    );

    ctx.save();
    ctx.font = `${block.weight} ${fontPx}px ${family}`;
    ctx.fillStyle = INK;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    // Without this the bidi run comes out reordered and the punctuation
    // lands on the wrong end of the sentence.
    if (block.rtl) ctx.direction = "rtl";

    const lineHeight = fontPx * 1.12;
    lines.forEach((line, index) => {
      ctx.fillText(line, width / 2, cursor + index * lineHeight);
    });
    ctx.restore();

    cursor += lines.length * lineHeight + blockGap;
  }

  const headlineBottom = cursor - blockGap;

  // The code, on a white card with a hard shadow, sat in whatever room the
  // headline left. The card and the two lines under it are treated as one
  // block and centred in that room: sizing the card off the width alone left
  // an A4 with the code high and a dead band across the bottom, because the
  // sheet is taller than it is wide and nothing was using the difference.
  const footerHeight = mm(16 * scale);
  const blockTop = headlineBottom + mm(8 * scale);
  const blockBottom = height - margin - mm(8 * scale);
  const room = blockBottom - blockTop;
  const cardSize = Math.max(mm(20 * scale), Math.min(innerWidth, room - footerHeight));
  const cardX = (width - cardSize) / 2;
  const cardY = blockTop + Math.max(0, (room - (cardSize + footerHeight)) / 2);
  const radius = mm(4 * scale);
  const shadow = mm(2.4 * scale);

  ctx.fillStyle = INK;
  roundedRect(ctx, cardX + shadow, cardY + shadow, cardSize, cardSize, radius);
  ctx.fill();

  ctx.fillStyle = SURFACE;
  roundedRect(ctx, cardX, cardY, cardSize, cardSize, radius);
  ctx.fill();
  ctx.lineWidth = mm(0.8 * scale);
  ctx.strokeStyle = INK;
  ctx.stroke();

  // The code itself, blitted at a whole number scale so no module edge is
  // ever resampled into grey.
  const quiet = mm(4 * scale);
  const target = cardSize - quiet * 2;
  const moduleScale = fitModuleScale(input.qr, target);
  const pixels = qrPixels(input.qr, moduleScale);
  const drawn = qrPixelSize(input.qr, moduleScale);
  const qrX = Math.round(cardX + (cardSize - drawn) / 2);
  const qrY = Math.round(cardY + (cardSize - drawn) / 2);
  ctx.putImageData(new ImageData(pixels.data, pixels.width, pixels.height), qrX, qrY);

  drawTicks(ctx, cardX - mm(3 * scale), cardY - mm(3 * scale), cardSize + mm(6 * scale), cardSize + mm(6 * scale), mm(5 * scale));

  // The address. Nothing tells them to scan it, because all three blocks
  // above already did.
  const urlSize = mm(4.6 * scale);
  drawMonoLine(ctx, input.url, width / 2, cardY + cardSize + mm(12 * scale), urlSize, fonts.mono, innerWidth);
}
