import type { Metadata } from "next";
import { CartContents } from "@/components/shop/cart-contents";
import { getSettings } from "@/lib/products";

export const metadata: Metadata = {
  title: "Your cart",
};

export default async function CartPage() {
  const settings = await getSettings();

  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      <h1 className="mb-6 text-2xl">Your cart</h1>
      <CartContents whatsappNumber={settings.whatsappNumber} />
    </main>
  );
}
