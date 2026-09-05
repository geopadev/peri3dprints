"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Button, Input, Notice, UTILITY_TEXT } from "@/components/ui";
import { createClient } from "@/lib/supabase/browser";
import {
  PRODUCT_IMAGES_BUCKET,
  PRODUCT_VIDEOS_BUCKET,
  productImageUrl,
  productVideoUrl,
} from "@/lib/product-image-url";
import type { ProductImageInput } from "@/lib/validation/product";
import { PhotoCropper } from "./photo-cropper";

/** The photo bucket's own ceiling. A 1600px JPEG is nowhere near it. */
const IMAGE_MAX_BYTES = 10 * 1024 * 1024;
/** The video bucket's ceiling, which is also the most this plan allows per upload. */
const VIDEO_MAX_BYTES = 50 * 1024 * 1024;

/** Only containers browsers actually play. Anything else is refused up front
 *  with a sentence rather than uploaded and then a dead player in the shop. */
const VIDEO_EXTENSIONS: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

type Pending = { id: string; name: string };

function withPositions(list: ProductImageInput[]): ProductImageInput[] {
  return list.map((item, index) => ({ ...item, position: index }));
}

/**
 * The cover is the first thing in the list and a card never plays video, so
 * a video is never allowed to be first. When a change would leave one there,
 * the first photo moves up instead. The only state this cannot fix is a list
 * with no photo at all, and the notice below the button says so.
 */
function photoFirst(list: ProductImageInput[]): ProductImageInput[] {
  if (list[0]?.kind !== "video") return list;
  const photoIndex = list.findIndex((item) => item.kind !== "video");
  if (photoIndex === -1) return list;
  const next = [...list];
  const [photo] = next.splice(photoIndex, 1);
  next.unshift(photo!);
  return next;
}

export type ImageUploaderProps = {
  images: ProductImageInput[];
  onChange: (images: ProductImageInput[]) => void;
};

/**
 * Photos and videos for a product, in the order the shop shows them.
 *
 * A photo goes through the cropper first, so what is uploaded is already the
 * square the shop needs and nothing downstream has to know about cropping. A
 * video goes up as it is, to its own bucket: nothing resizes it, and the
 * gallery shows it whole.
 */
export function ImageUploader({ images, onChange }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Pending[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Photos waiting for the cropper, one at a time, in the order picked.
  const [queue, setQueue] = useState<File[]>([]);
  const [batchTotal, setBatchTotal] = useState(0);
  useEffect(() => {
    if (queue.length === 0) setBatchTotal(0);
  }, [queue.length]);

  // The list as of the latest render, plus whatever this batch has already
  // added. Picking three photos at once used to end with one: each upload
  // appended to the `images` prop as it was when the batch started, so the
  // second overwrote the first and the third overwrote the second.
  const latest = useRef(images);
  latest.current = images;

  function append(item: ProductImageInput) {
    const next = withPositions(photoFirst([...latest.current, item]));
    latest.current = next;
    onChange(next);
  }

  function replace(next: ProductImageInput[]) {
    const ordered = withPositions(photoFirst(next));
    latest.current = ordered;
    onChange(ordered);
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    const picked = Array.from(files);
    if (inputRef.current) inputRef.current.value = "";

    const photos = picked.filter((file) => !file.type.startsWith("video/"));
    const videos = picked.filter((file) => file.type.startsWith("video/"));

    if (photos.length > 0) {
      setBatchTotal((total) => total + photos.length);
      setQueue((current) => [...current, ...photos]);
    }
    for (const video of videos) await uploadVideo(video);
  }

  async function upload(
    bucket: string,
    path: string,
    body: Blob,
    contentType: string,
    name: string,
    item: ProductImageInput,
  ) {
    const key = `${path}-${Math.round(performance.now())}`;
    setPending((current) => [...current, { id: key, name }]);
    try {
      const { error: uploadError } = await createClient()
        .storage.from(bucket)
        .upload(path, body, { contentType, upsert: false });
      if (uploadError) throw new Error(uploadError.message);
      append(item);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "That would not upload. Try again in a moment.",
      );
    } finally {
      setPending((current) => current.filter((entry) => entry.id !== key));
    }
  }

  function onCropped(blob: Blob) {
    const file = queue[0];
    // Move to the next photo straight away. The upload carries on underneath,
    // so a batch of five is five quick fits, not five waits.
    setQueue((current) => current.slice(1));
    if (blob.size > IMAGE_MAX_BYTES) {
      setError("That photo is still too big after resizing. Try a smaller one.");
      return;
    }
    const path = `${crypto.randomUUID()}.jpg`;
    void upload(PRODUCT_IMAGES_BUCKET, path, blob, "image/jpeg", file?.name ?? "photo", {
      id: null,
      kind: "image",
      storage_path: path,
      alt_text: "",
      position: 0,
    });
  }

  async function uploadVideo(file: File) {
    const extension = VIDEO_EXTENSIONS[file.type];
    if (!extension) {
      setError("That video format will not play in a browser. Use an MP4 or WebM.");
      return;
    }
    if (file.size > VIDEO_MAX_BYTES) {
      setError("That video is over 50 MB. Trim it or export it smaller and try again.");
      return;
    }
    const path = `${crypto.randomUUID()}.${extension}`;
    await upload(PRODUCT_VIDEOS_BUCKET, path, file, file.type, file.name, {
      id: null,
      kind: "video",
      storage_path: path,
      alt_text: "",
      position: 0,
    });
  }

  /** Whether moving `from` to `to` would leave a video as the cover while a photo exists. */
  function canMove(from: number, to: number): boolean {
    if (to < 0 || to >= images.length) return false;
    const next = [...images];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved!);
    return next[0]?.kind !== "video" || !next.some((item) => item.kind !== "video");
  }

  function move(from: number, to: number) {
    if (!canMove(from, to)) return;
    const next = [...images];
    const [moved] = next.splice(from, 1);
    if (!moved) return;
    next.splice(to, 0, moved);
    replace(next);
  }

  function remove(index: number) {
    replace(images.filter((_, i) => i !== index));
  }

  function setAlt(index: number, alt: string) {
    replace(images.map((item, i) => (i === index ? { ...item, alt_text: alt } : item)));
  }

  const videoFirst = images[0]?.kind === "video";
  const cropping = queue[0];

  return (
    <div className="flex flex-col gap-4">
      {cropping && (
        <PhotoCropper
          file={cropping}
          index={batchTotal - queue.length}
          total={batchTotal}
          onDone={onCropped}
          onSkip={() => setQueue((current) => current.slice(1))}
          onCancel={() => setQueue([])}
        />
      )}

      <div>
        {/* No capture attribute on purpose. It sent every phone straight to
            the camera, with no way to pick from the gallery and, since a
            camera hands back one shot, no way to add several at once. Without
            it the phone asks: camera or photos. */}
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/mp4,video/webm,video/quicktime"
          multiple
          onChange={(event) => void handleFiles(event.target.files)}
          className="sr-only"
          id="product-photos"
        />
        <Button type="button" variant="secondary" onClick={() => inputRef.current?.click()}>
          Add photos or videos
        </Button>
        <p className="mt-2 text-sm">
          Pick as many as you like. Each photo gets fitted to a square first. The first photo is
          the one people see in the shop, use the arrows to change the order. Videos show on the
          product page only, and an MP4 plays on every phone.
        </p>
      </div>

      {error && <Notice role="alert">{error}</Notice>}

      {videoFirst && (
        <Notice role="alert">
          A video cannot be the first thing on a product. Add a photo and it becomes the cover.
        </Notice>
      )}

      {pending.length > 0 && (
        <ul className="flex flex-col gap-2">
          {pending.map((item) => (
            <li key={item.id} className={UTILITY_TEXT}>
              {item.name}: uploading
            </li>
          ))}
        </ul>
      )}

      <ul className="flex flex-col gap-4">
        {images.map((item, index) => (
          <li
            key={item.storage_path}
            className="flex gap-3 rounded-card border-2 border-ink bg-surface p-3"
          >
            {item.kind === "video" ? (
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-card border-2 border-ink bg-ink">
                <video
                  src={productVideoUrl(item.storage_path)}
                  muted
                  playsInline
                  preload="metadata"
                  className="h-full w-full object-contain"
                />
                <span
                  className={`${UTILITY_TEXT} absolute right-1 bottom-1 rounded-pill border-2 border-ink bg-surface px-1.5 text-ink`}
                >
                  Video
                </span>
              </div>
            ) : (
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-card border-2 border-ink bg-paper">
                <Image
                  src={productImageUrl(item.storage_path)}
                  alt={item.alt_text || "Photo with no description yet"}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </div>
            )}

            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <span className={UTILITY_TEXT}>
                  {index === 0
                    ? "Cover"
                    : item.kind === "video"
                      ? `Video ${index + 1}`
                      : `Photo ${index + 1}`}
                </span>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label="Move earlier"
                    disabled={!canMove(index, index - 1)}
                    onClick={() => move(index, index - 1)}
                  >
                    Up
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label="Move later"
                    disabled={!canMove(index, index + 1)}
                    onClick={() => move(index, index + 1)}
                  >
                    Down
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label="Remove"
                    onClick={() => remove(index)}
                  >
                    Remove
                  </Button>
                </div>
              </div>

              <Input
                value={item.alt_text}
                onChange={(event) => setAlt(index, event.target.value)}
                placeholder={item.kind === "video" ? "What happens in the video" : "What is in the photo"}
                aria-label={`Description for ${item.kind === "video" ? "video" : "photo"} ${index + 1}`}
                invalid={item.alt_text.trim() === ""}
              />
              <p className="text-sm">
                Describe it plainly. Blind buyers hear this, and it is what search engines read.
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
