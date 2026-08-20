import Link from "next/link";
import { UTILITY_TEXT } from "@/components/ui";
import { FOCUS_RING } from "@/components/ui/focus-ring";
import { cn } from "@/lib/cn";
import { getCategories } from "@/lib/products";

/**
 * Wraps rather than scrolls sideways. These are filters on the shop page, not
 * the site's navigation: that lives in the drawer behind the menu button, so
 * nobody has to swipe a hidden row to find out what is for sale.
 */
export async function CategoryChips({ activeSlug }: { activeSlug?: string }) {
  const categories = await getCategories();
  if (categories.length === 0) return null;

  return (
    <nav aria-label="Categories">
      <ul className="flex flex-wrap gap-2">
        <li>
          <Chip href="/shop" active={!activeSlug}>
            All
          </Chip>
        </li>
        {categories.map((category, index) => (
          <li key={category.slug}>
            <Chip
              href={`/shop/${category.slug}`}
              active={activeSlug === category.slug}
              tone={CHIP_TONES[index % CHIP_TONES.length]}
            >
              {category.name}
            </Chip>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/*
  Cycled by position, not by category, because categories are edited by the
  owner and a mapping keyed on a name would break the first time one is
  renamed. Several accents sit next to each other here, which the one accent
  per section rule otherwise forbids: it works because the chips are small,
  pill shaped and ink bordered, so a row of them reads as a rack of spools
  rather than as colours competing for the same job.
*/
const CHIP_TONES = ["bg-info", "bg-highlight", "bg-offer"] as const;

function Chip({
  href,
  active,
  tone,
  children,
}: {
  href: string;
  active: boolean;
  tone?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex min-h-11 items-center rounded-pill border-2 border-ink px-4",
        UTILITY_TEXT,
        "whitespace-nowrap",
        active ? "bg-ink text-paper" : cn(tone ?? "bg-surface", "text-ink"),
        FOCUS_RING,
      )}
    >
      {children}
    </Link>
  );
}
