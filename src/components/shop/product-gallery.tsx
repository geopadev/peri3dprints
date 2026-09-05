"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { FOCUS_RING } from "@/components/ui/focus-ring";
import { UTILITY_TEXT } from "@/components/ui/type";
import { cn } from "@/lib/cn";
import { productImageUrl, productVideoUrl } from "@/lib/product-image-url";

export type GalleryItem = {
  storagePath: string;
  altText: string;
  kind: "image" | "video";
};

export type ProductGalleryProps = {
  /** Photos and videos in the owner's order. The first is always a photo. */
  images: GalleryItem[];
};

/**
 * A photo fills the square: it was cropped to it at upload. A video is
 * shown whole on ink instead, because nobody fitted it to anything and a
 * cropped video would lose whatever the owner was pointing the phone at.
 */
function Slide({ item, priority, sizes }: { item: GalleryItem; priority: boolean; sizes: string }) {
  if (item.kind === "video") {
    return (
      <video
        src={productVideoUrl(item.storagePath)}
        controls
        playsInline
        preload="metadata"
        aria-label={item.altText}
        className="absolute inset-0 h-full w-full bg-ink object-contain"
      />
    );
  }
  return (
    <Image
      src={productImageUrl(item.storagePath)}
      alt={item.altText}
      fill
      sizes={sizes}
      priority={priority}
      className="object-cover"
    />
  );
}

function PlayGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M6 4l10 6-10 6z" fill="currentColor" />
    </svg>
  );
}

/**
 * One component, not two: desktop gets a main image with thumbnails,
 * mobile gets a swipeable scroll-snap row with dots, and both share the
 * same active-index state so the two views cannot drift out of sync.
 */
export function ProductGallery({ images }: ProductGalleryProps) {
  const [active, setActive] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);

  if (images.length === 0) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-card border-2 border-ink bg-paper font-mono text-xs tracking-utility text-ink-soft uppercase">
        No photo
      </div>
    );
  }

  const current = images[active] ?? images[0]!;

  function label(item: GalleryItem, index: number) {
    return `${item.kind === "video" ? "video" : "photo"} ${index + 1}`;
  }

  function scrollToIndex(index: number) {
    const scroller = scrollerRef.current;
    const child = scroller?.children[index];
    if (child instanceof HTMLElement) {
      child.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
    }
  }

  function onScroll() {
    const scroller = scrollerRef.current;
    if (!scroller || scroller.clientWidth === 0) return;
    const index = Math.round(scroller.scrollLeft / scroller.clientWidth);
    setActive(Math.min(images.length - 1, Math.max(0, index)));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative hidden aspect-square w-full overflow-hidden rounded-card border-2 border-ink bg-paper lg:block">
        <Slide key={current.storagePath} item={current} priority sizes="50vw" />
      </div>

      {images.length > 1 && (
        <div className="hidden gap-2 lg:flex">
          {images.map((item, index) => (
            <button
              key={item.storagePath}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Show ${label(item, index)}`}
              aria-current={index === active}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-card border-2 border-ink",
                index === active ? "opacity-100" : "opacity-50 hover:opacity-100",
                FOCUS_RING,
              )}
            >
              {item.kind === "video" ? (
                <span
                  className={cn(
                    UTILITY_TEXT,
                    "flex h-full w-full flex-col items-center justify-center gap-0.5 bg-ink text-paper",
                  )}
                >
                  <PlayGlyph />
                  Video
                </span>
              ) : (
                <Image
                  src={productImageUrl(item.storagePath)}
                  alt=""
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              )}
            </button>
          ))}
        </div>
      )}

      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory overflow-x-auto rounded-card border-2 border-ink lg:hidden"
      >
        {images.map((item, index) => (
          <div
            key={item.storagePath}
            className="relative aspect-square w-full flex-none snap-start bg-paper"
          >
            <Slide item={item} priority={index === 0} sizes="100vw" />
          </div>
        ))}
      </div>

      {images.length > 1 && (
        <div className="flex justify-center gap-2 lg:hidden" role="tablist" aria-label="Photos and videos">
          {images.map((item, index) => (
            <button
              key={item.storagePath}
              type="button"
              role="tab"
              aria-selected={index === active}
              aria-label={`Go to ${label(item, index)}`}
              onClick={() => scrollToIndex(index)}
              className={cn(
                "h-2.5 w-2.5 rounded-pill border-2 border-ink",
                index === active ? "bg-ink" : "bg-surface",
                FOCUS_RING,
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
