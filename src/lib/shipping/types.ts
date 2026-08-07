import type { Database } from "@/lib/database.types";

export type Carrier = Database["public"]["Enums"]["carrier"];
export type ShipZone = Database["public"]["Enums"]["ship_zone"];

/** What checkout knows about the parcel, independent of who carries it. */
export type ShippingDestination = {
  countryCode: string;
  postalCode?: string | null;
  /** Set once a locker has been chosen, for methods that require one. */
  lockerId?: string | null;
};

export type ShippingCart = {
  subtotalCents: number;
  totalWeightGrams: number;
};

export type ShippingMethod = {
  id: string;
  code: string;
  carrier: Carrier;
  zone: ShipZone;
  label: string;
  description: string | null;
  baseCents: number;
  perExtra100gCents: number;
  freeOverCents: number | null;
  maxWeightGrams: number | null;
  requiresLocker: boolean;
  supportsCod: boolean;
};

export type ShippingQuote = {
  method: ShippingMethod;
  priceCents: number;
  /** True when the order cleared the method's free shipping threshold. */
  free: boolean;
};

/** A method that cannot be offered, and the reason in words checkout can show. */
export type ExcludedMethod = {
  method: ShippingMethod;
  reason: "too-heavy" | "wrong-zone";
  message: string;
};

/**
 * Every provider method returns one of these rather than throwing. An expected
 * failure, a missing BOX NOW account, a rejected phone number, is data that
 * checkout has to render, not an exception to catch.
 */
export type ShippingResult<T> = { ok: true; data: T } | { ok: false; error: ShippingError };

export type ShippingError = {
  /** `not-configured` means the carrier account does not exist yet, which is a
   * normal state before launch rather than a fault. */
  code: "not-configured" | "invalid-input" | "carrier-rejected" | "network" | "unknown";
  message: string;
  /** The carrier's own code, when it gave one, for the admin and the logs. */
  carrierCode?: string;
};

export type Shipment = {
  /** The carrier's reference, stored on the order as carrier_reference. */
  reference: string;
  trackingNumber: string | null;
  trackingUrl: string | null;
  /** `pending` means the owner still has to book the parcel himself. */
  status: "pending" | "created";
};

export type ShipmentRequest = {
  orderNumber: string;
  totalCents: number;
  /** Cash on delivery needs the carrier to collect money at the door. */
  collectOnDeliveryCents: number | null;
  destination: ShippingDestination;
  recipient: { name: string; phone: string; email: string };
  items: { title: string; quantity: number }[];
};

export type TrackingInfo = {
  trackingNumber: string;
  trackingUrl: string | null;
  status: string | null;
};

/**
 * The boundary CLAUDE.md section 7 asks for. Checkout talks to this and never
 * to a carrier directly, so adding a carrier does not touch checkout code.
 */
export interface ShippingProvider {
  readonly carrier: Carrier;
  quote(
    cart: ShippingCart,
    destination: ShippingDestination,
  ): Promise<ShippingResult<ShippingQuote[]>>;
  createShipment(request: ShipmentRequest): Promise<ShippingResult<Shipment>>;
  getLabel(
    reference: string,
  ): Promise<ShippingResult<{ pdf: ArrayBuffer } | { unavailable: true }>>;
  track(reference: string): Promise<ShippingResult<TrackingInfo>>;
}
