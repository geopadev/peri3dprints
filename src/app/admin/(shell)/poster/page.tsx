import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import { PosterStudio } from "@/components/admin/poster-studio";
import { qrMatrix, posterUrl } from "@/lib/poster";
import { siteOrigin } from "@/lib/site-origin";

export const metadata: Metadata = {
  title: "Stall poster",
  robots: { index: false, follow: false },
};

/*
  Greek and Hebrew for the sign, and nothing else on the site uses it, so it
  is loaded here rather than in the root layout: a buyer never downloads it.

  It exists because the shop's own display face cannot draw either script.
  Bricolage Grotesque ships no Greek and no Hebrew, verified against the
  Google Fonts metadata, so those lines would come out as empty boxes. Of the
  fifteen families that carry Latin, Greek and Hebrew together, this is the
  one that sits closest to the rest of the shop.
*/
const translations = Open_Sans({
  subsets: ["latin", "greek", "hebrew"],
  weight: ["700"],
  display: "swap",
});

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
          A sign with a code people can scan to open the shop, in English, Greek and Hebrew. Print
          it and put it on the table.
        </p>
      </div>

      <PosterStudio
        origin={origin}
        shopName={SHOP_NAME}
        initialQr={qrMatrix(posterUrl(origin, true))}
        translationsClassName={translations.className}
      />
    </main>
  );
}
