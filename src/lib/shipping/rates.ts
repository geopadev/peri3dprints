import type {
  ExcludedMethod,
  ShipZone,
  ShippingCart,
  ShippingMethod,
  ShippingQuote,
} from "./types";

/**
 * EU member states, ISO 3166-1 alpha-2. Cyprus is deliberately absent: it is
 * an EU member but gets its own zone here, because a parcel inside Cyprus is
 * a different proposition from one to Ireland.
 */
const EU_COUNTRIES = new Set([
  "AT",
  "BE",
  "BG",
  "HR",
  "CZ",
  "DK",
  "EE",
  "FI",
  "FR",
  "DE",
  "GR",
  "HU",
  "IE",
  "IT",
  "LV",
  "LT",
  "LU",
  "MT",
  "NL",
  "PL",
  "PT",
  "RO",
  "SK",
  "SI",
  "ES",
  "SE",
]);

/** The first 500g are covered by the base rate. */
export const INCLUDED_WEIGHT_GRAMS = 500;

export function resolveZone(countryCode: string): ShipZone {
  const code = countryCode.trim().toUpperCase();
  if (code === "CY") return "cy";
  if (EU_COUNTRIES.has(code)) return "eu";
  return "world";
}

/**
 * base + one step per whole 100g over the first 500, then zeroed if the order
 * cleared the method's free shipping threshold. Weight is rounded up, so 501g
 * costs one step rather than a fraction of one.
 */
export function quoteForMethod(method: ShippingMethod, cart: ShippingCart): ShippingQuote {
  const free = method.freeOverCents !== null && cart.subtotalCents >= method.freeOverCents;

  if (free) {
    return { method, priceCents: 0, free: true };
  }

  const excessGrams = Math.max(0, cart.totalWeightGrams - INCLUDED_WEIGHT_GRAMS);
  const steps = Math.ceil(excessGrams / 100);

  return {
    method,
    priceCents: method.baseCents + steps * method.perExtra100gCents,
    free: false,
  };
}

export type RateResult = {
  quotes: ShippingQuote[];
  /** Methods that could not be offered, with a reason checkout can show. */
  excluded: ExcludedMethod[];
  zone: ShipZone;
};

/**
 * Picks the methods that can actually carry this order to this country, and
 * prices them. A method is excluded rather than silently dropped, so checkout
 * can say "that is too heavy for the post" instead of just showing fewer
 * options than the buyer saw a minute ago.
 */
export function rateShipping(
  methods: ShippingMethod[],
  cart: ShippingCart,
  countryCode: string,
): RateResult {
  const zone = resolveZone(countryCode);
  const quotes: ShippingQuote[] = [];
  const excluded: ExcludedMethod[] = [];

  for (const method of methods) {
    if (method.zone !== zone) {
      excluded.push({
        method,
        reason: "wrong-zone",
        message: `${method.label} does not go to that country.`,
      });
      continue;
    }

    if (method.maxWeightGrams !== null && cart.totalWeightGrams > method.maxWeightGrams) {
      excluded.push({
        method,
        reason: "too-heavy",
        message: `${method.label} takes parcels up to ${formatGrams(method.maxWeightGrams)}, and this one is ${formatGrams(cart.totalWeightGrams)}.`,
      });
      continue;
    }

    quotes.push(quoteForMethod(method, cart));
  }

  quotes.sort((a, b) => a.priceCents - b.priceCents);

  return { quotes, excluded, zone };
}

function formatGrams(grams: number): string {
  return grams >= 1000 ? `${(grams / 1000).toFixed(grams % 1000 === 0 ? 0 : 1)} kg` : `${grams} g`;
}
