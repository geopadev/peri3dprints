"use client";

import { useEffect, useRef, useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  Notice,
  UTILITY_TEXT,
} from "@/components/ui";
import { FOCUS_RING } from "@/components/ui/focus-ring";
import { cn } from "@/lib/cn";
import { centred, clampCrop, MAX_ZOOM, zoomAt, type Crop } from "./crop-math";

/** Longest edge of what gets uploaded, per CLAUDE.md section 8. */
export const CROP_OUTPUT_MAX = 1600;
const JPEG_QUALITY = 0.82;

export type PhotoCropperProps = {
  file: File;
  /** "Photo 2 of 3", so a batch does not feel endless. */
  index: number;
  total: number;
  onDone: (blob: Blob) => void;
  /** Leave this photo out and move on to the next one. */
  onSkip: () => void;
  /** Stop the whole batch. */
  onCancel: () => void;
};

/*
  Everything is drawn onto a canvas, deliberately, rather than positioning an
  <img> with a transform the way most croppers do. The reduced motion block in
  globals.css sets transform: none on everything, which would leave a
  transform based cropper showing the wrong part of the photo for exactly the
  people who asked for less motion. A canvas draws the crop the same way for
  everyone.
*/
function paint(canvas: HTMLCanvasElement | null, bitmap: ImageBitmap, crop: Crop) {
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const pixels = Math.max(1, Math.round(rect.width * dpr));
  if (canvas.width !== pixels || canvas.height !== pixels) {
    canvas.width = pixels;
    canvas.height = pixels;
  }
  const context = canvas.getContext("2d");
  if (!context) return;
  context.imageSmoothingQuality = "high";
  context.clearRect(0, 0, pixels, pixels);
  context.drawImage(bitmap, crop.x, crop.y, crop.size, crop.size, 0, 0, pixels, pixels);
}

async function renderCrop(bitmap: ImageBitmap, crop: Crop): Promise<Blob> {
  const out = Math.max(1, Math.min(CROP_OUTPUT_MAX, Math.round(crop.size)));
  const canvas = document.createElement("canvas");
  canvas.width = out;
  canvas.height = out;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not read that photo.");
  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap, crop.x, crop.y, crop.size, crop.size, 0, 0, out, out);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not read that photo."))),
      "image/jpeg",
      JPEG_QUALITY,
    );
  });
}

/**
 * Fit a photo to the square before it is uploaded, the way a profile picture
 * is fitted: drag to move, pinch or slide to zoom, and what is in the square
 * is what the shop shows. Done at upload on purpose. The stored file is the
 * crop, so nothing downstream has to know a crop ever happened.
 */
export function PhotoCropper({ file, index, total, onDone, onSkip, onCancel }: PhotoCropperProps) {
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
  const [crop, setCrop] = useState<Crop | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const editorRef = useRef<HTMLCanvasElement>(null);
  const cardRef = useRef<HTMLCanvasElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ distance: number; crop: Crop } | null>(null);

  // Decode once per file. from-image applies the EXIF rotation, so a phone
  // photo taken sideways is upright before it is ever drawn or cropped.
  useEffect(() => {
    let cancelled = false;
    let decoded: ImageBitmap | null = null;
    setBitmap(null);
    setCrop(null);
    setError(null);
    setBusy(false);
    createImageBitmap(file, { imageOrientation: "from-image" })
      .then((image) => {
        if (cancelled) {
          image.close();
          return;
        }
        decoded = image;
        setBitmap(image);
        setCrop(centred(image.width, image.height));
      })
      .catch(() => {
        if (!cancelled) {
          setError("Could not open that photo. It may be a format this browser cannot read.");
        }
      });
    return () => {
      cancelled = true;
      decoded?.close();
    };
  }, [file]);

  // Draw on every change, and again when the dialog changes size, which on a
  // phone means rotating it.
  useEffect(() => {
    if (!bitmap || !crop) return;
    const draw = () => {
      paint(editorRef.current, bitmap, crop);
      paint(cardRef.current, bitmap, crop);
    };
    draw();
    const editor = editorRef.current;
    if (!editor) return;
    const observer = new ResizeObserver(draw);
    observer.observe(editor);
    return () => observer.disconnect();
  }, [bitmap, crop]);

  // Wheel zoom wants preventDefault, which React's synthetic onWheel cannot
  // give because the listener is passive. So it is attached by hand.
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || !bitmap) return;
    const { width, height } = bitmap;
    function onWheel(event: WheelEvent) {
      event.preventDefault();
      const rect = editor!.getBoundingClientRect();
      const anchorX = (event.clientX - rect.left) / rect.width;
      const anchorY = (event.clientY - rect.top) / rect.height;
      const factor = Math.exp(-event.deltaY * 0.002);
      setCrop((current) =>
        current ? zoomAt(current, factor, anchorX, anchorY, width, height) : current,
      );
    }
    editor.addEventListener("wheel", onWheel, { passive: false });
    return () => editor.removeEventListener("wheel", onWheel);
  }, [bitmap]);

  function onPointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 2 && crop) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { distance: Math.hypot(a!.x - b!.x, a!.y - b!.y), crop };
    }
  }

  function onPointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    const previous = pointers.current.get(event.pointerId);
    if (!previous || !bitmap) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const rect = event.currentTarget.getBoundingClientRect();
    const { width, height } = bitmap;

    if (pointers.current.size >= 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      const distance = Math.hypot(a!.x - b!.x, a!.y - b!.y);
      if (distance === 0) return;
      // Fingers apart is zooming in, which is a smaller crop.
      const factor = distance / pinch.current.distance;
      const midX = ((a!.x + b!.x) / 2 - rect.left) / rect.width;
      const midY = ((a!.y + b!.y) / 2 - rect.top) / rect.height;
      setCrop(zoomAt(pinch.current.crop, factor, midX, midY, width, height));
      return;
    }

    const dx = event.clientX - previous.x;
    const dy = event.clientY - previous.y;
    // Functional update: two moves can land between renders, and the second
    // must build on the first rather than on the crop both of them started from.
    setCrop((current) => {
      if (!current) return current;
      const scale = current.size / rect.width;
      return clampCrop({ ...current, x: current.x - dx * scale, y: current.y - dy * scale }, width, height);
    });
  }

  function onPointerUp(event: React.PointerEvent<HTMLCanvasElement>) {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLCanvasElement>) {
    if (!bitmap) return;
    const { width, height } = bitmap;
    const nudge = (current: Crop) => current.size * 0.05;
    const moves: Record<string, (current: Crop) => Crop> = {
      ArrowLeft: (c) => ({ ...c, x: c.x - nudge(c) }),
      ArrowRight: (c) => ({ ...c, x: c.x + nudge(c) }),
      ArrowUp: (c) => ({ ...c, y: c.y - nudge(c) }),
      ArrowDown: (c) => ({ ...c, y: c.y + nudge(c) }),
      "+": (c) => zoomAt(c, 1.1, 0.5, 0.5, width, height),
      "=": (c) => zoomAt(c, 1.1, 0.5, 0.5, width, height),
      "-": (c) => zoomAt(c, 1 / 1.1, 0.5, 0.5, width, height),
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    setCrop((current) => (current ? clampCrop(move(current), width, height) : current));
  }

  const maxSize = bitmap ? Math.min(bitmap.width, bitmap.height) : 1;
  const zoom = crop ? maxSize / crop.size : 1;

  function onZoom(value: number) {
    if (!bitmap) return;
    const { width, height } = bitmap;
    setCrop((current) =>
      current ? zoomAt(current, (current.size * value) / maxSize, 0.5, 0.5, width, height) : current,
    );
  }

  async function useThisPhoto() {
    if (!bitmap || !crop) return;
    setBusy(true);
    try {
      onDone(await renderCrop(bitmap, crop));
    } catch {
      setError("Could not save that crop. Try again.");
      setBusy(false);
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      {/* A tap outside does not close it: on a phone a drag that ends past
          the edge of the square is the commonest way to leave the panel, and
          losing a whole batch to that would be maddening. Escape still works. */}
      <DialogContent className="max-w-md" onInteractOutside={(event) => event.preventDefault()}>
        <DialogTitle>{total > 1 ? `Fit photo ${index + 1} of ${total}` : "Fit the photo"}</DialogTitle>
        <DialogDescription>
          Drag to move it, pinch or use the slider to zoom. The square is exactly what the shop
          shows, on the card and on the product page.
        </DialogDescription>

        <div className="mt-4 flex flex-col gap-4">
          <div className="relative">
            <canvas
              ref={editorRef}
              tabIndex={0}
              role="img"
              aria-label="The photo, fitted to a square. Arrow keys move it, plus and minus zoom."
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onKeyDown={onKeyDown}
              className={cn(
                "block aspect-square w-full cursor-move touch-none rounded-card border-2 border-ink bg-paper",
                FOCUS_RING,
              )}
            />
            {!bitmap && !error && (
              <p
                className={cn(UTILITY_TEXT, "absolute inset-0 flex items-center justify-center")}
              >
                Opening the photo
              </p>
            )}
          </div>

          {error && <Notice role="alert">{error}</Notice>}

          <label className="flex items-center gap-3">
            <span className={cn(UTILITY_TEXT, "shrink-0")}>Zoom</span>
            <input
              type="range"
              min={1}
              max={MAX_ZOOM}
              step={0.01}
              value={zoom}
              disabled={!bitmap}
              onChange={(event) => onZoom(Number(event.target.value))}
              aria-label="Zoom"
              className="h-11 w-full accent-ink"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={!bitmap}
              onClick={() => bitmap && setCrop(centred(bitmap.width, bitmap.height))}
            >
              Reset
            </Button>
          </label>

          <div className="flex items-center gap-4">
            <div
              aria-hidden="true"
              className="w-28 shrink-0 overflow-hidden rounded-card border-2 border-ink bg-surface shadow-hard"
            >
              <canvas ref={cardRef} className="block aspect-square w-full bg-paper" />
              <div className="flex flex-col gap-1.5 p-2">
                <span className="block h-2 w-3/4 rounded-pill bg-ink" />
                <span className="block h-2 w-1/3 rounded-pill bg-ink" />
              </div>
            </div>
            <p className="text-sm">
              How it sits on a card in the shop. The big square above it is the product page.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onCancel} disabled={busy}>
            Stop
          </Button>
          {total > 1 && (
            <Button type="button" variant="secondary" onClick={onSkip} disabled={busy}>
              Skip this one
            </Button>
          )}
          <Button type="button" onClick={useThisPhoto} disabled={!bitmap || !crop || busy}>
            {busy ? "Saving" : "Use this photo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
