import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SpecStrip } from "@/components/ui";
import { ProductCard } from "@/components/shop/product-card";
import { ProductGallery } from "@/components/shop/product-gallery";
import { ProductPurchasePanel } from "@/components/shop/product-purchase-panel";
import { productImageUrl } from "@/lib/product-image-url";
import { getProductBySlug, getRelatedProducts, getSettings } from "@/lib/products";
import { siteOrigin } from "@/lib/site-origin";
import { whatsappLink } from "@/lib/whatsapp-link";

const RELATED_COUNT = 4;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};

  const description = product.shortDescription ?? product.description ?? undefined;
  const cover = product.images[0];

  return {
    title: product.title,
    description,
    openGraph: {
      type: "website",
      title: product.title,
      description,
      images: cover ? [{ url: productImageUrl(cover.storagePath, 1200) }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [related, settings, origin] = await Promise.all([
    product.categoryId
      ? getRelatedProducts(product.categoryId, product.id, RELATED_COUNT)
      : Promise.resolve([]),
    getSettings(),
    siteOrigin(),
  ]);

  const productUrl = `${origin}/product/${product.slug}`;
  const whatsappHref = settings.whatsappNumber
    ? whatsappLink(settings.whatsappNumber, `Hi, I'm asking about ${product.title}: ${productUrl}`)
    : null;

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-10 px-5 py-8">
      <div className="grid gap-8 lg:grid-cols-2">
        <ProductGallery images={product.images} />

        <div className="flex flex-col gap-5">
          <div>
            <h1 className="text-2xl">{product.title}</h1>
            {product.shortDescription && <p className="mt-1">{product.shortDescription}</p>}
          </div>

          <SpecStrip
            material={product.spec.material ?? undefined}
            dimensionsMm={product.spec.dimensionsMm ?? undefined}
            weightGrams={product.spec.weightGrams ?? undefined}
            printMinutes={product.spec.printMinutes ?? undefined}
            note={product.spec.note ?? undefined}
          />

          <ProductPurchasePanel
            productId={product.id}
            priceCents={product.priceCents}
            variants={product.variants}
            madeToOrder={product.madeToOrder}
            leadTimeDays={product.leadTimeDays}
            stockQty={product.stockQty}
            whatsappHref={whatsappHref}
          />

          {product.description && (
            <div className="border-t-2 border-ink pt-5">
              <p className="whitespace-pre-line">{product.description}</p>
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="flex flex-col gap-4 border-t-2 border-ink pt-8">
          <h2 className="text-xl">You might also like</h2>
          <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
