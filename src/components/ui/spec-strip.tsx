import { Fragment } from "react";
import { cn } from "@/lib/cn";

/**
 * The signature element. A mono, uppercase row of real printing facts:
 *
 *   PLA · 82 × 40 × 95 MM · 46 G · 4 H 20 M · ARTICULATED
 *
 * Every field is optional and only the ones present are rendered, so a
 * half-filled product row still reads as a spec sheet rather than as gaps.
 * Honest information, not decoration. Keep whatever sits around it quiet.
 */
export type SpecStripProps = {
  /**
   * The card version. Bounded to two lines, and it never breaks inside a
   * fact.
   *
   * The card used to force one line with overflow hidden, which chopped the
   * text mid character: a 70 x 70 x 110 mm print read as "70 × 70 × 1" and
   * looked like a complete measurement. A wrong size on a shop card is worse
   * than a missing one. Whole facts now move to a second line, and anything
   * past two lines is dropped rather than half shown.
   */
  compact?: boolean;
  material?: string;
  /** x, y, z in millimetres. */
  dimensionsMm?: readonly [number, number, number];
  weightGrams?: number;
  printMinutes?: number;
  note?: string;
  className?: string;
};

function isPositive(n: number | undefined): n is number {
  return typeof n === "number" && Number.isFinite(n) && n > 0;
}

function formatDimensions(dims: readonly [number, number, number] | undefined): string | null {
  if (!dims || dims.length !== 3 || !dims.every(isPositive)) return null;
  return `${dims[0]} × ${dims[1]} × ${dims[2]} mm`;
}

function formatPrintTime(minutes: number | undefined): string | null {
  if (!isPositive(minutes)) return null;
  const total = Math.round(minutes);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h > 0 && m > 0) return `${h} h ${m} m`;
  if (h > 0) return `${h} h`;
  return `${m} m`;
}

function clean(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function SpecStrip({
  material,
  dimensionsMm,
  weightGrams,
  printMinutes,
  note,
  compact = false,
  className,
}: SpecStripProps) {
  const parts: string[] = [
    clean(material),
    formatDimensions(dimensionsMm),
    isPositive(weightGrams) ? `${Math.round(weightGrams)} g` : null,
    formatPrintTime(printMinutes),
    clean(note),
  ].filter((part): part is string => part !== null);

  if (parts.length === 0) return null;

  return (
    <ul
      className={cn(
        "flex flex-wrap items-center font-mono text-xs tracking-utility text-ink uppercase",
        // A prop rather than a class from the caller: cn has no tailwind-merge,
        // so two conflicting height classes would both ship and source order
        // would decide which won.
        //
        // leading-4 pins the line box at 16px so max-h-8 is exactly two of
        // them. A third line lands wholly outside the box and is clipped
        // whole, rather than showing as a sliver of letter tops.
        compact && "max-h-8 overflow-hidden leading-4",
        className,
      )}
    >
      {parts.map((part, i) => (
        <Fragment key={`${i}-${part}`}>
          {/* Its own item, not tucked inside the fact that follows it. Glued
              to the fact, the separator ate 16px of whatever line that fact
              landed on, which was the difference between a 129px dimension
              fitting a 143px phone card and being ellipsised two pixels
              short. Alone, it stays behind on the previous line and the fact
              starts the next one at full width. */}
          {i > 0 && (
            <li aria-hidden="true" className="px-2">
              ·
            </li>
          )}
          <li className={cn("flex items-center", compact && "min-w-0")}>
            {/* nowrap keeps a fact whole, so it moves to the next line rather
                than breaking across one. truncate is the backstop for the one
                case that fits nowhere, a long note on a narrow card: it
                ellipsises, which reads as cut off rather than as the whole
                thing. text-overflow works here because a flex item is itself
                a block container, though it would do nothing on the ul. */}
            <span className={compact ? "truncate whitespace-nowrap" : undefined}>{part}</span>
          </li>
        </Fragment>
      ))}
    </ul>
  );
}
