import { cn } from "@/lib/cn";

export type BandTone = "action" | "info" | "highlight" | "offer" | "ink" | "plain";

/**
 * A full width strip carrying one accent. This is what "one loud accent per
 * section" means in practice: a page is a stack of bands, and each one owns at
 * most a single colour.
 *
 * A page carries at most one action band. The others may repeat, but never next
 * to each other, or the page stops reading as sections and starts reading as
 * stripes.
 */
const TONE: Record<BandTone, string> = {
  action: "bg-action",
  info: "bg-info",
  highlight: "bg-highlight",
  offer: "bg-offer",
  ink: "bg-ink text-paper",
  // A wash, not a fill: for framing controls without shouting over them.
  plain: "bg-info-wash",
};

export type SectionBandProps = React.ComponentPropsWithRef<"section"> & {
  tone?: BandTone;
};

export function SectionBand({ tone = "plain", className, ...props }: SectionBandProps) {
  return (
    <section
      className={cn("border-y-2 border-ink px-5 py-10 text-ink", TONE[tone], className)}
      {...props}
    />
  );
}
