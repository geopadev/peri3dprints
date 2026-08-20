"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Button, Input, UTILITY_TEXT } from "@/components/ui";
import { createClient } from "@/lib/supabase/browser";
import { PRODUCT_IMAGES_BUCKET, productImageUrl } from "@/lib/product-image-url";
import type { ProductImageInput } from "@/lib/validation/product";

const MAX_EDGE = 1600;
const MAX_BYTES = 10 * 1024 * 1024;

type Pending = { id: string; name: string; progress: "resizing" | "uploading" | "failed" };

/**
 * Resizes to 1600px on the longest edge before upload. He is on a phone on
 * mobile data behind a market table, and a modern phone camera file is 4 to 8 MB.
 * Sending that raw would be slow and would blow the bucket's 10 MB limit.
 */
async function resize(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("Could not read that photo.");
  }
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not read that photo."))),
      "image/jpeg",
      0.82,
    );
  });
}

export type ImageUploaderProps = {
  images: ProductImageInput[];
  onChange: (images: ProductImageInput[]) => void;
};

export function ImageUploader({ images, onChange }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Pending[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);

    const supabase = createClient();

    for (const file of Array.from(files)) {
      const key = `${file.name}-${file.size}-${images.length}-${Math.round(performance.now())}`;
      setPending((current) => [...current, { id: key, name: file.name, progress: "resizing" }]);

      try {
        const blob = await resize(file);

        if (blob.size > MAX_BYTES) {
          throw new Error("That photo is still too big after resizing. Try a smaller one.");
        }

        setPending((current) =>
          current.map((item) => (item.id === key ? { ...item, progress: "uploading" } : item)),
        );

        const path = `${crypto.randomUUID()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from(PRODUCT_IMAGES_BUCKET)
          .upload(path, blob, { contentType: "image/jpeg", upsert: false });

        if (uploadError) throw new Error(uploadError.message);

        onChange([
          ...images,
          { id: null, storage_path: path, alt_text: "", position: images.length },
        ]);
        setPending((current) => current.filter((item) => item.id !== key));
      } catch (cause) {
        setPending((current) => current.filter((item) => item.id !== key));
        setError(
          cause instanceof Error
            ? cause.message
            : "That photo would not upload. Try again in a moment.",
        );
      }
    }

    if (inputRef.current) inputRef.current.value = "";
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= images.length) return;
    const next = [...images];
    const [moved] = next.splice(from, 1);
    if (!moved) return;
    next.splice(to, 0, moved);
    onChange(next.map((image, index) => ({ ...image, position: index })));
  }

  function remove(index: number) {
    onChange(images.filter((_, i) => i !== index).map((image, i) => ({ ...image, position: i })));
  }

  function setAlt(index: number, alt: string) {
    onChange(images.map((image, i) => (i === index ? { ...image, alt_text: alt } : image)));
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          // capture lets the phone offer the camera directly.
          capture="environment"
          onChange={(event) => void handleFiles(event.target.files)}
          className="sr-only"
          id="product-photos"
        />
        <Button type="button" variant="secondary" onClick={() => inputRef.current?.click()}>
          Add photos
        </Button>
        <p className="mt-2 text-sm">
          The first photo is the one people see in the shop. Drag order with the arrows.
        </p>
      </div>

      {error && <p className="rounded-card border-2 border-magenta p-3">{error}</p>}

      {pending.length > 0 && (
        <ul className="flex flex-col gap-2">
          {pending.map((item) => (
            <li key={item.id} className={UTILITY_TEXT}>
              {item.name}: {item.progress === "resizing" ? "resizing" : "uploading"}
            </li>
          ))}
        </ul>
      )}

      <ul className="flex flex-col gap-4">
        {images.map((image, index) => (
          <li
            key={image.storage_path}
            className="flex gap-3 rounded-card border-2 border-ink bg-surface p-3"
          >
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-card border-2 border-ink bg-paper">
              <Image
                src={productImageUrl(image.storage_path, 192)}
                alt={image.alt_text || "Photo with no description yet"}
                fill
                sizes="96px"
                className="object-cover"
              />
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <span className={UTILITY_TEXT}>{index === 0 ? "Cover" : `Photo ${index + 1}`}</span>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label="Move photo earlier"
                    disabled={index === 0}
                    onClick={() => move(index, index - 1)}
                  >
                    Up
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label="Move photo later"
                    disabled={index === images.length - 1}
                    onClick={() => move(index, index + 1)}
                  >
                    Down
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label="Remove photo"
                    onClick={() => remove(index)}
                  >
                    Remove
                  </Button>
                </div>
              </div>

              <Input
                value={image.alt_text}
                onChange={(event) => setAlt(index, event.target.value)}
                placeholder="What is in the photo"
                aria-label={`Description for photo ${index + 1}`}
                invalid={image.alt_text.trim() === ""}
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
