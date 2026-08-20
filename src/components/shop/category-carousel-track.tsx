"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button, UTILITY_TEXT } from "@/components/ui";
import { FOCUS_RING, FOCUS_RING_ON_ACCENT } from "@/components/ui/focus-ring";
import { cn } from "@/lib/cn";
import { nextIndex } from "./carousel-index";

export type CarouselCategory = { slug: string; name: string };

const ROTATE_MS = 5000;

/** Below this many pixels a touch is a tap or a scroll, not a swipe. */
const SWIPE_THRESHOLD = 40;

/**
 * The masthead. One card whose contents change, rather than a row of cards:
 * the shop name sits on the first face and each category takes a turn after
 * it.
 *
 * CLAUDE.md section 3 names this as the fourth place motion is allowed and
 * lists the conditions it carries:
 *
 *   - it stops while someone hovers it or tabs through it
 *   - it does not start at all under prefers-reduced-motion
 *   - the arrows and a swipe always work, so nobody waits on the timer
 *
 * Nothing moves by transform. The reduced motion block sets transform: none
 * globally, so a sliding track would collapse into a pile for exactly the
 * people least able to cope with it. Faces are swapped, not slid.
 */
export function CategoryCarouselTrack({ categories }: { categories: CarouselCategory[] }) {
  // Face 0 is the shop itself, then one per category.
  const faces = categories.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef<number | null>(null);

  const go = useCallback(
    (delta: number) => {
      setIndex((current) => nextIndex(current, delta, faces));
    },
    [faces],
  );

  useEffect(() => {
    if (paused || faces < 2) return;
    // Checked in JavaScript because this is a timer, not a transition, and a
    // media query cannot switch a timer off.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setInterval(() => go(1), ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [paused, faces, go]);

  if (faces === 0) return null;

  const category = categories[index];

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={(event) => {
        touchStart.current = event.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        const start = touchStart.current;
        touchStart.current = null;
        if (start === null) return;
        const dx = (event.changedTouches[0]?.clientX ?? start) - start;
        if (Math.abs(dx) < SWIPE_THRESHOLD) return;
        go(dx < 0 ? 1 : -1);
      }}
    >
      <div
        className={cn(
          "rounded-card border-2 border-ink bg-action px-4 py-6 text-ink shadow-hard",
          // Padded at the sides on desktop so the arrows sit in their own
          // gutters rather than over the words.
          "sm:px-20 sm:py-8",
          // Two columns from sm: the fixed half on the left, the half that
          // changes on the right, so the eye knows where to look.
          "flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8",
        )}
      >
        <div className="sm:max-w-md">
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl">Peri 3D Prints</h1>
          <p className="mt-2">Printed to order in Cyprus. Message me if you want it different.</p>
        </div>

        {/* A floor on the height so the card does not resize as names of
            different lengths take their turn. aria-live so the change is
            announced rather than the card silently becoming about something
            else. */}
        <div
          className="flex min-h-24 flex-col justify-center sm:min-h-28 sm:items-end sm:text-right"
          aria-live="polite"
        >
          <span className={cn(UTILITY_TEXT, "text-ink")}>Have a look at</span>
          <Link href={`/shop/${category.slug}`} className="mt-2 inline-block">
            <Button variant="onAccent">{category.name}</Button>
          </Link>
        </div>
      </div>

      {faces > 1 && (
        <>
          <Arrow side="left" onClick={() => go(-1)} />
          <Arrow side="right" onClick={() => go(1)} />

          <ul className="mt-3 flex justify-center gap-2">
            {categories.map((entry, i) => (
              <li key={entry.slug}>
                <button
                  type="button"
                  aria-label={`Show ${entry.name}`}
                  aria-current={i === index ? "true" : undefined}
                  onClick={() => setIndex(i)}
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
      aria-label={side === "left" ? "Previous category" : "Next category"}
      className={cn(
        // Inside the card, so the control belongs to the thing it changes.
        // Hidden on a phone, where a swipe does the same job without covering
        // the words. Positioned with top and a negative margin rather than a
        // translate, since reduced motion kills transforms.
        "absolute top-1/2 -mt-14 hidden h-11 w-11 items-center justify-center sm:flex",
        "rounded-pill border-2 border-ink bg-ink text-paper",
        side === "left" ? "left-3" : "right-3",
        FOCUS_RING_ON_ACCENT,
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
