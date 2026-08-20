import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui";
import { AnnouncementStrip } from "@/components/shop/announcement-strip";
import { CategoryCarousel } from "@/components/shop/category-carousel";
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

      <CategoryCarousel />

      {/* The stock starts immediately under the masthead, per section 5: the
          most characteristic thing about a market stall is the table covered
          in things. */}
      <div className="px-5 py-6">
        <ProductGrid
          products={products}
          emptyTitle="Nothing on the shelf yet"
          emptyDescription="Message me and I'll print what you want."
          /* Not a custom print button: the band underneath already offers
             exactly that, and the same button twice on one screen reads as a
             mistake. The shelf being empty is a reason to talk, not to fill in
             a form. */
          emptyAction={
            <Link href="/messages">
              <Button>Message me</Button>
            </Link>
          }
        />
      </div>

      <CustomRequestBand />
    </main>
  );
}
