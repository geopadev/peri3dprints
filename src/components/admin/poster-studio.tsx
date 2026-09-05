"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Card, Field, Input, Notice, Select, UTILITY_TEXT } from "@/components/ui";
import { cn } from "@/lib/cn";
import {
  drawPoster,
  HEADLINE_MAX,
  HEADLINE_PRESETS,
  POSTER_FOOTNOTE,
  POSTER_SIZES,
  posterUrl,
  PREVIEW_DPI,
  PRINT_DPI,
  mmToPt,
  mmToPx,
  type PosterFonts,
  type PosterSizeId,
  type QrMatrix,
} from "@/lib/poster";

export type PosterStudioProps = {
  /** Where the shop actually lives, from the server. */
  origin: string;
  shopName: string;
  /** Built on the server for the default link, so the first paint has a real
   *  code without waiting for anything to download. */
  initialQr: QrMatrix;
};

function slugForFile(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "poster";
}

/**
 * The poster the owner prints for his stall.
 *
 * One renderer, drawPoster, does the preview and the file. The preview runs
 * at a low dpi so a phone can hold it, the file at 300, and nothing else
 * differs: what he lines up on screen is the layout that comes out of the
 * printer.
 */
export function PosterStudio({ origin, shopName, initialQr }: PosterStudioProps) {
  const [headline, setHeadline] = useState<string>(HEADLINE_PRESETS[0]);
  const [sizeId, setSizeId] = useState<PosterSizeId>("a4");
  const [url, setUrl] = useState(origin);
  const [marker, setMarker] = useState(true);
  const [qr, setQr] = useState<QrMatrix>(initialQr);
  const [fonts, setFonts] = useState<PosterFonts | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const probeRef = useRef<HTMLDivElement>(null);
  const size = POSTER_SIZES[sizeId];
  const encoded = posterUrl(url, marker);

  // The real loaded families, read off the page rather than named here.
  // next/font generates its own family names at build time, so writing
  // "Bricolage Grotesque" into ctx.font would silently draw in a fallback.
  useEffect(() => {
    let cancelled = false;
    const probe = probeRef.current;
    if (!probe) return;
    const display = getComputedStyle(probe.children[0]!).fontFamily;
    const mono = getComputedStyle(probe.children[1]!).fontFamily;

    // Wait for the faces themselves, not just the stylesheet: a canvas drawn
    // before they arrive bakes the fallback into the file.
    //
    // Carrying on when that fails is deliberate. A rejected font load used to
    // leave this stuck on "Loading the fonts" with the download disabled and
    // nothing to press. A poster in the fallback face is worth having; a
    // poster he cannot download is not.
    void Promise.allSettled([
      document.fonts.load(`800 64px ${display}`),
      document.fonts.load(`400 24px ${mono}`),
      document.fonts.ready,
    ]).then(() => {
      if (!cancelled) setFonts({ display, mono });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // The code only has to be rebuilt when the link changes, and the library
  // that builds it is only fetched if he actually edits it.
  useEffect(() => {
    if (encoded === posterUrl(origin, true)) return;
    let cancelled = false;
    void import("@/lib/poster/qr")
      .then(({ qrMatrix }) => {
        if (!cancelled) setQr(qrMatrix(encoded));
      })
      .catch(() => {
        if (!cancelled) setError("Could not build a code for that address. Check it and try again.");
      });
    return () => {
      cancelled = true;
    };
  }, [encoded, origin]);

  const render = useCallback(
    (canvas: HTMLCanvasElement, dpi: number) => {
      if (!fonts) return false;
      canvas.width = Math.round(mmToPx(size.widthMm, dpi));
      canvas.height = Math.round(mmToPx(size.heightMm, dpi));
      const ctx = canvas.getContext("2d");
      if (!ctx) return false;
      drawPoster(
        ctx,
        { headline, shopName, url: encoded, footnote: POSTER_FOOTNOTE, qr, size, fonts },
        dpi,
      );
      return true;
    },
    [encoded, fonts, headline, qr, shopName, size],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) render(canvas, PREVIEW_DPI);
  }, [render]);

  async function download() {
    setBusy(true);
    setError(null);
    try {
      const canvas = document.createElement("canvas");
      if (!render(canvas, PRINT_DPI)) throw new Error("not ready");

      const png = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );
      if (!png) throw new Error("no image");

      const { PDFDocument } = await import("pdf-lib");
      const pdf = await PDFDocument.create();
      const embedded = await pdf.embedPng(await png.arrayBuffer());
      const widthPt = mmToPt(size.widthMm);
      const heightPt = mmToPt(size.heightMm);
      const page = pdf.addPage([widthPt, heightPt]);
      page.drawImage(embedded, { x: 0, y: 0, width: widthPt, height: heightPt });

      const bytes = await pdf.save();
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      const href = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = href;
      link.download = `${slugForFile(shopName)}-poster-${sizeId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(href);
    } catch {
      setError("Could not make the PDF. Try again, or try a smaller size.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      {/* Off screen, purely so the canvas can ask what the real fonts are. */}
      <div ref={probeRef} aria-hidden="true" className="sr-only">
        <span className="font-display font-extrabold">A</span>
        <span className="font-mono">A</span>
      </div>

      <div className="flex flex-col gap-4 lg:w-80 lg:shrink-0">
        <Card className="flex flex-col gap-4">
          <Field label="What it says above the code" hint={`${headline.length} of ${HEADLINE_MAX}`}>
            {(control) => (
              <Input
                {...control}
                value={headline}
                maxLength={HEADLINE_MAX}
                onChange={(event) => setHeadline(event.target.value)}
              />
            )}
          </Field>

          <div className="flex flex-wrap gap-2">
            {HEADLINE_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setHeadline(preset)}
                className={cn(
                  "rounded-pill border-2 border-ink px-3 py-1 text-left text-sm",
                  preset === headline ? "bg-ink text-paper" : "bg-surface text-ink",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan focus-visible:outline-solid",
                )}
              >
                {preset}
              </button>
            ))}
          </div>
        </Card>

        <Card className="flex flex-col gap-4">
          <Field label="Paper size">
            {(control) => (
              <Select
                {...control}
                value={sizeId}
                onChange={(event) => setSizeId(event.target.value as PosterSizeId)}
              >
                {Object.entries(POSTER_SIZES).map(([id, paper]) => (
                  <option key={id} value={id}>
                    {paper.label}, {paper.widthMm} by {paper.heightMm} mm
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field
            label="Where it sends people"
            hint="Change this when you get your own domain, then print it again."
          >
            {(control) => (
              <Input
                {...control}
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                inputMode="url"
              />
            )}
          </Field>

          <label className="flex min-h-11 items-center gap-3">
            <input
              type="checkbox"
              checked={marker}
              onChange={(event) => setMarker(event.target.checked)}
              className="h-5 w-5 accent-ink"
            />
            <span>Mark these visits as coming from the stall</span>
          </label>
          <p className="text-sm">
            Adds <span className="font-mono text-xs">?s=stall</span> to the link, so you can tell
            how many people scanned it. No cookies, nothing for anyone to agree to.
          </p>
        </Card>

        <Card className="flex flex-col gap-3">
          <Button onClick={() => void download()} disabled={!fonts || busy}>
            {busy ? "Making the PDF" : `Download the ${size.label}`}
          </Button>
          <p className="text-sm">
            It saves as a PDF at print quality. Send it to a print shop, or print it at home on
            plain paper.
          </p>
          {error && <Notice role="alert">{error}</Notice>}
        </Card>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p className={cn(UTILITY_TEXT, "text-ink")}>
          {size.label} preview, {size.widthMm} by {size.heightMm} mm
        </p>
        <div className="rounded-card border-2 border-ink bg-paper p-3 shadow-hard">
          <canvas
            ref={canvasRef}
            aria-label={`Poster preview: ${headline}`}
            role="img"
            className="mx-auto block h-auto w-full max-w-md"
          />
        </div>
        {!fonts && <p className={cn(UTILITY_TEXT, "text-ink")}>Loading the fonts</p>}
      </div>
    </div>
  );
}
