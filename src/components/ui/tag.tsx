import { cn } from "@/lib/cn";
import { UTILITY_TEXT } from "@/components/ui/type";

/**
 * No flame tone on purpose: CLAUDE.md section 3 gives flame to the primary
 * button and nothing else.
 */
export type TagTone = "neutral" | "stock" | "sale" | "info" | "made";
export type TagSize = "sm" | "md";

export type TagProps = React.ComponentPropsWithRef<"span"> & {
  tone?: TagTone;
  size?: TagSize;
};

const TONE: Record<TagTone, string> = {
  neutral: "bg-surface text-ink",
  stock: "bg-highlight text-ink",
  sale: "bg-offer text-ink",
  info: "bg-info text-ink",
  /*
    Deliberately colourless. Made to order is true of nearly everything in this
    shop, so as a filled tag it would put the same colour on every card and the
    colour would stop meaning anything. A dashed edge borrows the language of
    the empty state instead: not on the shelf.
  */
  made: "bg-surface text-ink border-dashed",
};

// sm exists because the md tag is too heavy for a 160px card on a phone.
const SIZE: Record<TagSize, string> = {
  sm: "px-2 py-0.5",
  md: "px-3 py-1",
};

export function Tag({ tone = "neutral", size = "md", className, ...props }: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill border-2 border-ink",
        SIZE[size],
        UTILITY_TEXT,
        TONE[tone],
        className,
      )}
      {...props}
    />
  );
}
