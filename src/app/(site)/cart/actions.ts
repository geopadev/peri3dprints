"use server";

import { priceCartLines, type PricedCart } from "@/lib/cart-pricing";
import type { CartLine } from "@/lib/cart-store";

/**
 * Thin wrapper so the client cart panel can call the pricing logic. The
 * client store only ever sends product and variant ids and a quantity, never
 * a price, and this is the only thing that turns that into money.
 */
export async function getPricedCart(lines: CartLine[]): Promise<PricedCart> {
  return priceCartLines(lines);
}
