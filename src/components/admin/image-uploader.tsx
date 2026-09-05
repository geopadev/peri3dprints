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
import type { Crop } from "./crop-math";
import { PhotoCropper, type CropResult } from "./photo-cropper";

/** The photo bucket's own ceiling. A 2400px JPEG is well under it. */
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

/**
 * A photo being refitted or replaced. Found again by path when the cropper
 * comes back, not by index, so reordering the list while it is open cannot
 * land the result on the wrong row.
 */
type Editing = {
  path: string;
  source: Blob;
  initialCrop: Crop | null;
  mode: "fit" | "replace";
};

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
 * square the shop needs and nothing downstream has to know about cropping.
 * The uncropped original goes up beside it, which is what makes "Fit" on an
 * existing photo possible later: the square is remade from the original, not
 * from the square. A video goes up as it is, to its own bucket.
 */
export function ImageUploader({ images, onChange }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const replacing = useRef<string | null>(null);
  const [pending, setPending] = useState<Pending[]>([]);
  const [error, setError] = useState<string | null>(null);

  // New photos waiting for the cropper, one at a time, in the order picked.
  const [queue, setQueue] = useState<File[]>([]);
  const [batchTotal, setBatchTotal] = useState(0);
  useEffect(() => {
    if (queue.length === 0) setBatchTotal(0);
  }, [queue.length]);

  // An existing photo in the cropper.
  const [editing, setEditing] = useState<Editing | null>(null);

  // The list as of the latest render, plus whatever this batch has already
  // added. Picking three photos at once used to end with one: each upload
  // appended to the `images` prop as it was when the batch started, so the
  // second overwrote the first and the third overwrote the second.
  const latest = useRef(images);
  latest.current = images;

  function replace(next: ProductImageInput[]) {
    const ordered = withPositions(photoFirst(next));
    latest.current = ordered;
    onChange(ordered);
  }

  function append(item: ProductImageInput) {
    replace([...latest.current, item]);
  }

  function patchRow(path: string, patch: Partial<ProductImageInput>) {
    replace(latest.current.map((item) => (item.storage_path === path ? { ...item, ...patch } : item)));
  }

  /** One upload, tracked in the pending list. Resolves to whether it landed. */
  async function putObject(
    bucket: string,
    path: string,
    body: Blob,
    contentType: string,
    name: string,
  ): Promise<boolean> {
    const key = `${path}-${Math.round(performance.now())}`;
    setPending((current) => [...current, { id: key, name }]);
    try {
      const { error: uploadError } = await createClient()
        .storage.from(bucket)
        .upload(path, body, { contentType, upsert: false });
      if (uploadError) throw new Error(uploadError.message);
      return true;
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "That would not upload. Try again in a moment.",
      );
      return false;
    } finally {
      setPending((current) => current.filter((entry) => entry.id !== key));
    }
  }

  /** Square first, then the original. A photo without its original is still a
   *  photo, just one that cannot be refitted, so that failure is not fatal. */
  async function putPhoto(
    result: CropResult,
    name: string,
  ): Promise<{ storage_path: string; original_path: string | null } | null> {
    if (result.square.size > IMAGE_MAX_BYTES) {
      setError("That photo is still too big after resizing. Try a smaller one.");
      return null;
    }
    const id = crypto.randomUUID();
    const storage_path = `${id}.jpg`;
    if (!(await putObject(PRODUCT_IMAGES_BUCKET, storage_path, result.square, "image/jpeg", name))) {
      return null;
    }
    let original_path: string | null = null;
    if (result.original && result.original.size <= IMAGE_MAX_BYTES) {
      const path = `${id}-full.jpg`;
      if (await putObject(PRODUCT_IMAGES_BUCKET, path, result.original, "image/jpeg", `${name} (original)`)) {
        original_path = path;
      }
    }
    return { storage_path, original_path };
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

  async function onNewPhoto(result: CropResult) {
    const file = queue[0];
    // Move to the next photo straight away. The upload carries on underneath,
    // so a batch of five is five quick fits, not five waits.
    setQueue((current) => current.slice(1));
    const stored = await putPhoto(result, file?.name ?? "photo");
    if (!stored) return;
    append({
      id: null,
      kind: "image",
      storage_path: stored.storage_path,
      original_path: stored.original_path,
      crop: stored.original_path ? result.crop : null,
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
    if (!(await putObject(PRODUCT_VIDEOS_BUCKET, path, file, file.type, file.name))) return;
    append({
      id: null,
      kind: "video",
      storage_path: path,
      original_path: null,
      crop: null,
      alt_text: "",
      position: 0,
    });
  }

  /** Reopen a photo in the cropper, from its original where there is one. */
  async function startFit(item: ProductImageInput) {
    setError(null);
    // A photo from before originals were kept is refitted from the file it
    // has. That file then becomes its original, see onEdited, so the next
    // refit starts from the same place rather than from a crop of a crop.
    const sourcePath = item.original_path ?? item.storage_path;
    const { data, error: downloadError } = await createClient()
      .storage.from(PRODUCT_IMAGES_BUCKET)
      .download(sourcePath);
    if (downloadError || !data) {
      setError("Could not open that photo to refit it. Try again in a moment.");
      return;
    }
    setEditing({
      path: item.storage_path,
      source: data,
      initialCrop: item.original_path ? item.crop : null,
      mode: "fit",
    });
  }

  function startReplace(item: ProductImageInput) {
    replacing.current = item.storage_path;
    replaceRef.current?.click();
  }

  function onReplaceFile(files: FileList | null) {
    const file = files?.[0];
    const path = replacing.current;
    replacing.current = null;
    if (replaceRef.current) replaceRef.current.value = "";
    if (!file || !path) return;
    if (file.type.startsWith("video/")) {
      setError("A photo can only be replaced by a photo. Add the video as its own item.");
      return;
    }
    setError(null);
    setEditing({ path, source: file, initialCrop: null, mode: "replace" });
  }

  async function onEdited(result: CropResult) {
    const target = editing;
    setEditing(null);
    if (!target) return;
    const current = latest.current.find((item) => item.storage_path === target.path);
    if (!current) return;

    const stored = await putPhoto(result, target.mode === "fit" ? "refit" : "replacement");
    if (!stored) return;

    // The old square becomes an orphan and is removed on save. For a refit the
    // original is kept, and for a photo that never had one, the file it was
    // just cropped from is promoted to be it.
    const original_path =
      target.mode === "replace"
        ? stored.original_path
        : (current.original_path ?? current.storage_path);

    patchRow(target.path, {
      storage_path: stored.storage_path,
      original_path,
      crop: original_path ? result.crop : null,
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
      {editing ? (
        <PhotoCropper
          key={`edit-${editing.path}`}
          source={editing.source}
          initialCrop={editing.initialCrop}
          withOriginal={editing.mode === "replace"}
          title={editing.mode === "fit" ? "Refit the photo" : "Fit the new photo"}
          confirmLabel={editing.mode === "fit" ? "Use this fit" : "Use this photo"}
          index={0}
          total={1}
          onDone={onEdited}
          onSkip={() => setEditing(null)}
          onCancel={() => setEditing(null)}
        />
      ) : cropping ? (
        <PhotoCropper
          key={`new-${batchTotal - queue.length}`}
          source={cropping}
          withOriginal
          title="Fit the photo"
          confirmLabel="Use this photo"
          index={batchTotal - queue.length}
          total={batchTotal}
          onDone={onNewPhoto}
          onSkip={() => setQueue((current) => current.slice(1))}
          onCancel={() => setQueue([])}
        />
      ) : null}

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
        <input
          ref={replaceRef}
          type="file"
          accept="image/*"
          onChange={(event) => onReplaceFile(event.target.files)}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        />
        <Button type="button" variant="secondary" onClick={() => inputRef.current?.click()}>
          Add photos or videos
        </Button>
        <p className="mt-2 text-sm">
          Pick as many as you like. Each photo gets fitted to a square first, and you can refit
          or replace it later without adding it again. The first photo is the one people see in
          the shop, use the arrows to change the order. Videos show on the product page only, and
          an MP4 plays on every phone.
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
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className={UTILITY_TEXT}>
                  {index === 0
                    ? "Cover"
                    : item.kind === "video"
                      ? `Video ${index + 1}`
                      : `Photo ${index + 1}`}
                </span>
                <div className="flex flex-wrap justify-end gap-1">
                  {item.kind === "image" && (
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        aria-label={`Refit photo ${index + 1}`}
                        onClick={() => void startFit(item)}
                      >
                        Fit
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        aria-label={`Replace photo ${index + 1}`}
                        onClick={() => startReplace(item)}
                      >
                        Replace
                      </Button>
                    </>
                  )}
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
                placeholder={
                  item.kind === "video" ? "What happens in the video" : "What is in the photo"
                }
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
