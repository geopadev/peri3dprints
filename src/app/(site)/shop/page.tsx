import type { Metadata } from "next";
import { ShopListing, type ShopSearchParams } from "./shop-listing";

export const metadata: Metadata = {
  title: "Shop",
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<ShopSearchParams>;
}) {
  return <ShopListing searchParams={await searchParams} />;
}
