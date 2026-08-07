import type { Metadata } from "next";
import { AnnouncementStrip } from "@/components/shop/announcement-strip";
import { CategoryChips } from "@/components/shop/category-chips";
import { CustomRequestBand } from "@/components/shop/custom-request-band";
import { ProductGrid } from "@/components/shop/product-grid";
import { getHeroProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Peri 3D Prints",
  description: "3D printed toys and objects, made to order in Cyprus.",
};

const HERO_PRODUCT_COUNT = 24;

export default async function HomePage() {
  const products = await getHeroProducts(HERO_PRODUCT_COUNT);

  return (
    <main>
      <AnnouncementStrip />

      <div className="pt-4">
        <CategoryChips />
      </div>

      {/* The hero is the stock itself: the grid starts immediately, with the
          shop name overlapping its top-left corner rather than sitting above
          it in a separate banner. */}
      <div className="relative px-5 py-6">
        <div className="absolute top-6 left-5 z-10 w-64 rounded-card border-2 border-ink bg-surface px-4 py-3 shadow-hard sm:w-80">
          <h1 className="font-display text-2xl sm:text-3xl">Peri 3D Prints</h1>
          <p className="mt-1 text-sm sm:text-base">
            Printed to order in Cyprus. Message me if you want it different.
          </p>
        </div>

        <ProductGrid
          products={products}
          emptyTitle="Nothing on the shelf yet"
          emptyDescription="Message me and I'll print what you want."
        />
      </div>

      <CustomRequestBand />
    </main>
  );
}
