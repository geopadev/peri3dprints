import type { Metadata } from "next";
import { StallRedirect } from "@/components/shop/stall-redirect";

export const metadata: Metadata = {
  // Absolute, not the bare string: the root layout templates every title as
  // "%s | Peri 3D Prints", which would have doubled the name here.
  title: { absolute: "Peri 3D Prints" },
  robots: { index: false, follow: false },
};

/**
 * Where the stall poster's code points, instead of "/" with a query string.
 *
 * The query string idea (?s=stall) does not actually work: Vercel's Pages
 * panel groups page views by pathname with the query string stripped, so
 * every visit from the poster would have silently merged into the same row
 * as every other homepage visit. Checked against Vercel's own docs rather
 * than assumed. Splitting by UTM parameter or by a custom event both exist,
 * but both are gated to a paid plan, and this shop is on the free one.
 *
 * A distinct path is the one thing the free plan's Pages panel does count
 * on its own: how many times "/stall" was visited is exactly how many times
 * the poster was scanned, with nothing to configure and nothing to pay for.
 * This page exists to be that path. It renders just long enough for the
 * page view to be recorded, then StallRedirect sends the visitor on to the
 * real homepage.
 */
export default function StallPage() {
  return <StallRedirect />;
}
