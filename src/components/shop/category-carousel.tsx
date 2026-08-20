import { getCategories } from "@/lib/products";
import { CategoryCarouselTrack } from "./category-carousel-track";

/**
 * The masthead, with the category carousel on it rather than in a strip
 * underneath. The orange card is the stage the cards sit on, so the shop name
 * and the categories read as one object.
 *
 * Server Component, so the categories are fetched here and the only client
 * JavaScript is the timer, the arrows and the swipe.
 */
export async function CategoryCarousel() {
  const categories = await getCategories();

  return (
    <section className="px-5 pt-5">
      <div className="rounded-card border-2 border-ink bg-action px-4 py-6 text-ink shadow-hard sm:px-6 sm:py-8">
        <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl">Peri 3D Prints</h1>
        <p className="mt-2 max-w-md">
          Printed to order in Cyprus. Message me if you want it different.
        </p>

        {categories.length > 0 && (
          <nav aria-label="Categories" className="mt-6">
            <CategoryCarouselTrack categories={categories} />
          </nav>
        )}
      </div>
    </section>
  );
}
