import { cn } from "@/lib/cn";
import { UTILITY_TEXT } from "@/components/ui/type";

/**
 * No flame tone on purpose. Flame has exactly two jobs, the primary button and
 * the loud block that opens a section, and a tag is neither. A tag that could
 * be flame would end up on a card, which is the one place the colour rules
 * keep quiet so the spec strip stays the loudest thing there.
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
