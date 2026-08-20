"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { UTILITY_TEXT } from "@/components/ui";
import { FOCUS_RING } from "@/components/ui/focus-ring";
import { cn } from "@/lib/cn";
import { nextIndex, slotOffset } from "./carousel-index";

export type CarouselCategory = { slug: string; name: string };

/*
  Colour follows the category, not the slot, so a card keeps its own colour as
  it comes round. Cycling by slot instead would make the colours strobe every
  five seconds, which is a different and much worse thing.

  Four tones, all saturated. A wash was the obvious fourth, but beside three
  solid fills it reads as a disabled card rather than a category, so ink takes
  the slot: a real colour rather than a faded one.
*/
const TONES = [
  "bg-info text-ink",
  "bg-highlight text-ink",
  "bg-offer text-ink",
  "bg-ink text-paper",
] as const;

const ROTATE_MS = 5000;

/** Below this many pixels a touch is a tap or a scroll, not a swipe. */
const SWIPE_THRESHOLD = 40;

/*
  Where each card sits. Three are on stage: one in front and one tucked behind
  each shoulder. Everything else waits off the sides.

  Position is left/width/height/opacity, never a transform. The reduced-motion
  block sets transform: none globally, so a scaled or translated card would
  collapse into the corner for exactly the people least able to cope with it.
  These properties still resolve correctly when the transition is switched off,
  so the layout is right either way and only the movement is lost.
*/
const SLOT_TEXT = {
  behindLeft: "items-start text-left",
  front: "items-start text-left",
  behindRight: "items-end text-right",
} as const;

const SLOTS = {
  /*
    The side cards are narrower than the gap either side of the front one, so
    the shoulder that peeks out is wide enough to read its own name. Earlier
    they were as wide as the front card and the label sat underneath it.
  */
  behindLeft: "left-[2%] top-[14%] h-[72%] w-[30%] z-10 opacity-100",
  front: "left-[26%] top-0 h-full w-[48%] z-20 opacity-100",
  behindRight: "left-[68%] top-[14%] h-[72%] w-[30%] z-10 opacity-100",
  offLeft: "left-[2%] top-[14%] h-[72%] w-[30%] z-0 opacity-0",
  offRight: "left-[68%] top-[14%] h-[72%] w-[30%] z-0 opacity-0",
} as const;

function slotClass(offset: number): string {
  if (offset === 0) return `${SLOTS.front} ${SLOT_TEXT.front}`;
  if (offset === -1) return `${SLOTS.behindLeft} ${SLOT_TEXT.behindLeft}`;
  if (offset === 1) return `${SLOTS.behindRight} ${SLOT_TEXT.behindRight}`;
  return offset < 0
    ? `${SLOTS.offLeft} ${SLOT_TEXT.behindLeft}`
    : `${SLOTS.offRight} ${SLOT_TEXT.behindRight}`;
}

/**
 * The category carousel: a loop of cards with the current one in front and its
 * neighbours tucked behind either shoulder.
 *
 * CLAUDE.md section 3 names this as the fourth place motion is allowed and
 * lists the conditions it carries: it stops while someone hovers it or tabs
 * through it, it does not start at all under prefers-reduced-motion, and the
 * arrows and a swipe always work so nobody waits on the timer.
 */
export function CategoryCarouselTrack({ categories }: { categories: CarouselCategory[] }) {
  const count = categories.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef<number | null>(null);

  const go = useCallback(
    (delta: number) => setIndex((current) => nextIndex(current, delta, count)),
    [count],
  );

  useEffect(() => {
    if (paused || count < 2) return;
    // Checked in JavaScript because this is a timer, not a transition, and a
    // media query cannot switch a timer off.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setInterval(() => go(1), ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [paused, count, go]);

  if (count === 0) return null;

  return (
    <div
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
      <div className="relative h-36 sm:h-44">
        {categories.map((category, i) => {
          const offset = slotOffset(i, index, count);
          const onStage = Math.abs(offset) <= 1;

          return (
            <Link
              key={category.slug}
              href={`/shop/${category.slug}`}
              aria-hidden={onStage ? undefined : true}
              tabIndex={onStage ? undefined : -1}
              className={cn(
                "absolute flex flex-col justify-end rounded-card border-2 border-ink p-3 shadow-hard",
                "transition-[left,top,width,height,opacity] duration-300 ease-press",
                TONES[i % TONES.length],
                slotClass(offset),
                FOCUS_RING,
              )}
            >
              <span className={cn(UTILITY_TEXT, "leading-tight")}>{category.name}</span>
            </Link>
          );
        })}
      </div>

      {count > 1 && (
        <div className="mt-3 flex items-center justify-center gap-3">
          <Arrow side="left" onClick={() => go(-1)} />
          <ul className="flex gap-2">
            {categories.map((category, i) => (
              <li key={category.slug}>
                <button
                  type="button"
                  aria-label={`Show ${category.name}`}
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
          <Arrow side="right" onClick={() => go(1)} />
        </div>
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
        // Beside the dots rather than over the cards: at this size an arrow
        // sitting on a card covers the name it is scrolling past.
        "flex h-11 w-11 shrink-0 items-center justify-center",
        "rounded-pill border-2 border-ink bg-surface text-ink",
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
