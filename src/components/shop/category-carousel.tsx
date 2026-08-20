import Link from "next/link";
import { UTILITY_TEXT } from "@/components/ui";
import { FOCUS_RING } from "@/components/ui/focus-ring";
import { cn } from "@/lib/cn";
import { getCategories } from "@/lib/products";

/**
 * The masthead, and a swipeable row of categories under it.
 *
 * Scroll snap rather than a slider: it is the browser's own scrolling, so
 * there is no transform to lose when reduced motion turns transforms off, no
 * timer advancing it on its own (section 3 bans a marquee), and no JavaScript
 * at all. Swipe on a phone, shift-scroll or drag on a desktop, tab through it
 * with a keyboard, all for free.
 *
 * One accent per panel, cycled by position rather than by category, because
 * the owner renames categories and a mapping keyed on a name breaks the first
 * time he does.
 */
/*
  Four tones, all of them saturated. A wash was the obvious fourth, but next to
  three solid fills it reads as a disabled panel rather than a category, so ink
  takes the slot: it is a real colour rather than a faded one.
*/
const PANEL_TONES = [
  "bg-info text-ink",
  "bg-highlight text-ink",
  "bg-offer text-ink",
  "bg-ink text-paper",
] as const;

export async function CategoryCarousel() {
  const categories = await getCategories();

  return (
    <section className="flex flex-col gap-4 px-5 pt-5">
      <div className="rounded-card border-2 border-ink bg-action px-4 py-6 text-ink shadow-hard sm:py-8">
        <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl">Peri 3D Prints</h1>
        <p className="mt-2">Printed to order in Cyprus. Message me if you want it different.</p>
      </div>

      {categories.length > 0 && (
        <nav aria-label="Categories">
          {/* -mx-5 px-5 so the row bleeds to the screen edge and the last panel
              does not look cut off, while the first still lines up with the
              masthead above it. */}
          <ul className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1">
            {categories.map((category, index) => (
              <li key={category.slug} className="snap-start">
                <Link
                  href={`/shop/${category.slug}`}
                  className={cn(
                    "flex h-24 w-44 flex-col justify-end rounded-card border-2 border-ink p-3 sm:h-28 sm:w-52",
                    PANEL_TONES[index % PANEL_TONES.length],
                    "shadow-hard",
                    FOCUS_RING,
                  )}
                >
                  <span className={cn(UTILITY_TEXT, "leading-tight")}>{category.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </section>
  );
}
