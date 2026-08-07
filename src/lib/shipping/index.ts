import "server-only";
import { createClient } from "@/lib/supabase/server";
import { BoxNowShippingProvider } from "./boxnow";
import { ManualShippingProvider } from "./manual";
import { rateShipping, type RateResult } from "./rates";
import type { Carrier, ShippingCart, ShippingMethod, ShippingProvider } from "./types";

export * from "./types";
export { rateShipping, resolveZone, quoteForMethod } from "./rates";
export { trackingUrlFor } from "./manual";

type MethodRow = {
  id: string;
  code: string;
  carrier: Carrier;
  zone: ShippingMethod["zone"];
  label: string;
  description: string | null;
  base_cents: number;
  per_extra_100g_cents: number | null;
  free_over_cents: number | null;
  max_weight_grams: number | null;
  requires_locker: boolean | null;
  supports_cod: boolean | null;
};

function toMethod(row: MethodRow): ShippingMethod {
  return {
    id: row.id,
    code: row.code,
    carrier: row.carrier,
    zone: row.zone,
    label: row.label,
    description: row.description,
    baseCents: row.base_cents,
    perExtra100gCents: row.per_extra_100g_cents ?? 0,
    freeOverCents: row.free_over_cents,
    maxWeightGrams: row.max_weight_grams,
    requiresLocker: row.requires_locker ?? false,
    supportsCod: row.supports_cod ?? false,
  };
}

export async function getShippingMethods(): Promise<ShippingMethod[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("shipping_methods")
    .select(
      "id, code, carrier, zone, label, description, base_cents, per_extra_100g_cents, free_over_cents, max_weight_grams, requires_locker, supports_cod",
    )
    .eq("active", true)
    .order("position", { ascending: true });

  return (data ?? []).map(toMethod);
}

/**
 * Checkout calls this and nothing else. Which carrier ends up moving the
 * parcel is decided here, from the method the buyer picked, so adding a
 * carrier never touches checkout code. CLAUDE.md section 7.
 */
export function providerFor(carrier: Carrier, methods: ShippingMethod[]): ShippingProvider {
  if (carrier === "boxnow") return new BoxNowShippingProvider(methods);
  // ACS, Cyprus Post and collect-in-person are all booked by hand.
  return new ManualShippingProvider(carrier, methods);
}

/** Every method that can carry this order, priced, plus the ones that cannot. */
export async function quoteShipping(cart: ShippingCart, countryCode: string): Promise<RateResult> {
  const methods = await getShippingMethods();
  return rateShipping(methods, cart, countryCode);
}
