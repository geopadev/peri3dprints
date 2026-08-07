import Link from "next/link";
import { FOCUS_RING } from "@/components/ui/focus-ring";
import { cn } from "@/lib/cn";
import { getCategories } from "@/lib/products";

export async function CategoryChips({ activeSlug }: { activeSlug?: string }) {
  const categories = await getCategories();
  if (categories.length === 0) return null;

  return (
    <nav aria-label="Categories" className="overflow-x-auto">
      <ul className="flex w-max gap-3 px-5 py-1">
        <li>
          <Chip href="/shop" active={!activeSlug}>
            All
          </Chip>
        </li>
        {categories.map((category) => (
          <li key={category.slug}>
            <Chip href={`/shop/${category.slug}`} active={activeSlug === category.slug}>
              {category.name}
            </Chip>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function Chip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex min-h-11 items-center rounded-pill border-2 border-ink px-4",
        "font-mono text-xs tracking-utility whitespace-nowrap uppercase",
        active ? "bg-ink text-paper" : "bg-surface text-ink",
        FOCUS_RING,
      )}
    >
      {children}
    </Link>
  );
}
