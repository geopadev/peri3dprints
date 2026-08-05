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
        className,
      )}
    >
      {parts.map((part, i) => (
        <li key={`${i}-${part}`} className="flex items-center">
          {i > 0 && (
            <span aria-hidden="true" className="px-2">
              ·
            </span>
          )}
          {part}
        </li>
      ))}
    </ul>
  );
}
