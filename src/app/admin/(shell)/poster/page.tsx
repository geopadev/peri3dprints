import type { Metadata } from "next";
import { PosterStudio } from "@/components/admin/poster-studio";
import { qrMatrix, posterUrl } from "@/lib/poster";
import { siteOrigin } from "@/lib/site-origin";

export const metadata: Metadata = {
  title: "Stall poster",
  robots: { index: false, follow: false },
};

/** Same name as the header. Not a setting, because renaming the shop is not a
 *  thing that happens from a phone behind a market table. */
const SHOP_NAME = "Peri 3D Prints";

export default async function AdminPosterPage() {
  const origin = await siteOrigin();

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-5 py-8">
      <div>
        <h1 className="text-2xl">Stall poster</h1>
        <p className="mt-1">
          A sign with a code people can scan to open the shop. Print it and put it on the table.
        </p>
      </div>

      <PosterStudio
        origin={origin}
        shopName={SHOP_NAME}
        initialQr={qrMatrix(posterUrl(origin, true))}
      />
    </main>
  );
}
