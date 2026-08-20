import { getCategories } from "@/lib/products";
import { CategoryCarouselTrack } from "./category-carousel-track";

/**
 * The masthead, and the category carousel under it.
 *
 * Server Component: the categories are fetched here and handed down, so the
 * only client JavaScript is the track's timer and arrows.
 */
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
          <CategoryCarouselTrack categories={categories} />
        </nav>
      )}
    </section>
  );
}
