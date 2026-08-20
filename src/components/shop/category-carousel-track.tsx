"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { UTILITY_TEXT } from "@/components/ui";
import { FOCUS_RING } from "@/components/ui/focus-ring";
import { cn } from "@/lib/cn";

export type CarouselCategory = { slug: string; name: string };

/*
  Four tones, all saturated. A wash was the obvious fourth, but beside three
  solid fills it read as a disabled panel rather than a category, so ink takes
  the slot: a real colour rather than a faded one.
*/
const PANEL_TONES = [
  "bg-info text-ink",
  "bg-highlight text-ink",
  "bg-offer text-ink",
  "bg-ink text-paper",
] as const;

const ROTATE_MS = 5000;

/**
 * The category carousel. It advances on its own, and CLAUDE.md section 3 names
 * it as the fourth place motion is allowed, with the conditions it has to meet:
 *
 *   - it stops on hover and on keyboard focus, so it never moves under someone
 *     who is reading or tabbing through it
 *   - it does not start at all under prefers-reduced-motion
 *   - the arrows and a swipe always work, so nobody has to wait for the timer
 *
 * Movement is `scrollTo`, not a transform. The reduced motion block sets
 * transform: none globally, so a translated track would collapse into a pile
 * for exactly the people least able to cope with it.
 */
export function CategoryCarouselTrack({ categories }: { categories: CarouselCategory[] }) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [paused, setPaused] = useState(false);
  const [index, setIndex] = useState(0);

  const scrollToIndex = useCallback((next: number) => {
    const track = trackRef.current;
    if (!track) return;
    const item = track.children[next] as HTMLElement | undefined;
    if (!item) return;
    /*
      Measured against the track's own scroll position rather than with
      offsetLeft. offsetLeft is relative to the nearest positioned ancestor,
      which is not the scroll container once the row bleeds with -mx-5, so
      subtracting the two mixed coordinate spaces and left the track a
      few pixels short of a panel instead of a full one.
    */
    const left =
      track.scrollLeft + (item.getBoundingClientRect().left - track.getBoundingClientRect().left);
    track.scrollTo({ left, behavior: "smooth" });
  }, []);

  const go = useCallback(
    (delta: number) => {
      setIndex((current) => {
        const next = (current + delta + categories.length) % categories.length;
        scrollToIndex(next);
        return next;
      });
    },
    [categories.length, scrollToIndex],
  );

  useEffect(() => {
    if (paused || categories.length < 2) return;
    // Checked here rather than in CSS: this is a timer, not a transition, so a
    // media query cannot switch it off.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) return;

    const timer = window.setInterval(() => go(1), ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [paused, categories.length, go]);

  // Keep the dots honest when someone swipes instead of using the arrows.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let frame = 0;
    function onScroll() {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const track = trackRef.current;
        if (!track) return;
        const items = Array.from(track.children) as HTMLElement[];
        const trackLeft = track.getBoundingClientRect().left;
        let nearest = 0;
        let best = Infinity;
        items.forEach((item, i) => {
          const distance = Math.abs(item.getBoundingClientRect().left - trackLeft);
          if (distance < best) {
            best = distance;
            nearest = i;
          }
        });
        setIndex(nearest);
      });
    }
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      track.removeEventListener("scroll", onScroll);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  if (categories.length === 0) return null;

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <ul
        ref={trackRef}
        className="-mx-5 flex snap-x snap-proximity gap-3 overflow-x-auto px-5 pb-1"
      >
        {categories.map((category, i) => (
          <li key={category.slug} className="snap-start">
            <Link
              href={`/shop/${category.slug}`}
              className={cn(
                "flex h-24 w-44 flex-col justify-end rounded-card border-2 border-ink p-3 shadow-hard sm:h-28 sm:w-52",
                PANEL_TONES[i % PANEL_TONES.length],
                FOCUS_RING,
              )}
            >
              <span className={cn(UTILITY_TEXT, "leading-tight")}>{category.name}</span>
            </Link>
          </li>
        ))}
      </ul>

      {categories.length > 1 && (
        <>
          {/* Desktop only: a phone swipes, and two 44px buttons over a 44px
              wide panel would cover the thing they scroll. */}
          <Arrow side="left" onClick={() => go(-1)} />
          <Arrow side="right" onClick={() => go(1)} />

          <ul className="mt-3 flex justify-center gap-2 sm:justify-start">
            {categories.map((category, i) => (
              <li key={category.slug}>
                <button
                  type="button"
                  aria-label={`Show ${category.name}`}
                  aria-current={i === index ? "true" : undefined}
                  onClick={() => {
                    setIndex(i);
                    scrollToIndex(i);
                  }}
                  className={cn(
                    "h-3 w-3 rounded-pill border-2 border-ink",
                    i === index ? "bg-ink" : "bg-surface",
                    FOCUS_RING,
                  )}
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function Arrow({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Previous categories" : "Next categories"}
      className={cn(
        "absolute top-1/2 hidden h-11 w-11 items-center justify-center sm:flex",
        // -mt rather than a translate: the reduced motion block kills
        // transforms, and a button that jumps to the corner is worse than none.
        "-mt-9 rounded-pill border-2 border-ink bg-surface text-ink shadow-hard",
        side === "left" ? "left-1" : "right-1",
        FOCUS_RING,
      )}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
          d={side === "left" ? "M10 3L5 8l5 5" : "M6 3l5 5-5 5"}
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="square"
        />
      </svg>
    </button>
  );
}
