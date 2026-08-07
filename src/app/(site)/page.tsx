import type { Metadata } from "next";
import { AnnouncementStrip } from "@/components/shop/announcement-strip";
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

      {/* The hero is the stock itself. The shop name is a cell of the same
          grid rather than a box floated over it: "beside" from CLAUDE.md
          section 5, which is the half of "over or beside" that does not cover
          up the products. It spans the full width on a phone and sits in the
          corner of the grid from small screens up. */}
      <div className="px-5 py-6">
        <ProductGrid
          products={products}
          emptyTitle="Nothing on the shelf yet"
          emptyDescription="Message me and I'll print what you want."
          lead={
            <div className="col-span-2 flex flex-col justify-center rounded-card border-2 border-ink bg-surface px-4 py-5 shadow-hard">
              <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl">Peri 3D Prints</h1>
              <p className="mt-2">
                Printed to order in Cyprus. Message me if you want it different.
              </p>
            </div>
          }
        />
      </div>

      <CustomRequestBand />
    </main>
  );
}
