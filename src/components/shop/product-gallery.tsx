"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { FOCUS_RING } from "@/components/ui/focus-ring";
import { cn } from "@/lib/cn";
import { productImageUrl } from "@/lib/product-image-url";

export type ProductGalleryProps = {
  images: { storagePath: string; altText: string }[];
};

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
        <Image
          src={productImageUrl(images[active]!.storagePath, 960)}
          alt={images[active]!.altText}
          fill
          sizes="50vw"
          priority
          className="object-cover"
        />
      </div>

      {images.length > 1 && (
        <div className="hidden gap-2 lg:flex">
          {images.map((image, index) => (
            <button
              key={image.storagePath}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Show photo ${index + 1}`}
              aria-current={index === active}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-card border-2 border-ink",
                index === active ? "opacity-100" : "opacity-50 hover:opacity-100",
                FOCUS_RING,
              )}
            >
              <Image
                src={productImageUrl(image.storagePath, 128)}
                alt=""
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory overflow-x-auto rounded-card border-2 border-ink lg:hidden"
      >
        {images.map((image, index) => (
          <div
            key={image.storagePath}
            className="relative aspect-square w-full flex-none snap-start bg-paper"
          >
            <Image
              src={productImageUrl(image.storagePath, 960)}
              alt={image.altText}
              fill
              sizes="100vw"
              priority={index === 0}
              className="object-cover"
            />
          </div>
        ))}
      </div>

      {images.length > 1 && (
        <div className="flex justify-center gap-2 lg:hidden" role="tablist" aria-label="Photos">
          {images.map((_, index) => (
            <button
              key={index}
              type="button"
              role="tab"
              aria-selected={index === active}
              aria-label={`Go to photo ${index + 1}`}
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
