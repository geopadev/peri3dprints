import { getCategories } from "@/lib/products";
import { CategoryCarouselTrack } from "./category-carousel-track";

/**
 * The masthead, which is also the category carousel: one card that changes
 * rather than a separate strip underneath it.
 *
 * Server Component, so the categories are fetched here and the only client
 * JavaScript is the timer, the arrows and the swipe.
 */
export async function CategoryCarousel() {
  const categories = await getCategories();

  return (
    <section className="px-5 pt-5">
      {categories.length > 0 ? (
        <nav aria-label="Categories">
          <CategoryCarouselTrack categories={categories} />
        </nav>
      ) : (
        // No categories yet, so there is nothing to rotate through. The
        // masthead still has to exist.
        <div className="rounded-card border-2 border-ink bg-action px-4 py-6 text-ink shadow-hard sm:py-8">
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl">Peri 3D Prints</h1>
          <p className="mt-2">Printed to order in Cyprus. Message me if you want it different.</p>
        </div>
      )}
    </section>
  );
}
