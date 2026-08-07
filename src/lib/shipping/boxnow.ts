import { rateShipping } from "./rates";
import type {
  Carrier,
  ShipmentRequest,
  Shipment,
  ShippingCart,
  ShippingDestination,
  ShippingMethod,
  ShippingProvider,
  ShippingResult,
  TrackingInfo,
} from "./types";

/**
 * BOX NOW Cyprus. Documented at boxnow.cy/en/diy/eshops/tailor-made.
 *
 * The account does not exist yet (see PROGRESS.md blockers), so every method
 * here has to return a clean `not-configured` result rather than throw. The
 * site has to build, boot and take orders by other carriers long before BOX
 * NOW is approved. Nothing in this file may crash on a missing env var.
 */

const TOKEN_SAFETY_MARGIN_MS = 60_000;

type CachedToken = { token: string; expiresAt: number };
let cachedToken: CachedToken | null = null;

/** Exported for tests: lets a suite clear state between cases. */
export function resetBoxNowTokenCache(): void {
  cachedToken = null;
}

type BoxNowConfig = {
  apiUrl: string;
  clientId: string;
  clientSecret: string;
};

function readConfig(): BoxNowConfig | null {
  const apiUrl = process.env.BOXNOW_API_URL;
  const clientId = process.env.BOXNOW_CLIENT_ID;
  const clientSecret = process.env.BOXNOW_CLIENT_SECRET;

  if (!apiUrl || !clientId || !clientSecret) return null;
  return { apiUrl: apiUrl.replace(/\/$/, ""), clientId, clientSecret };
}

const NOT_CONFIGURED: ShippingResult<never> = {
  ok: false,
  error: {
    code: "not-configured",
    message:
      "BOX NOW is not set up yet. Pick another way to get it, or message me and we will sort it out.",
  },
};

/**
 * Their P4xx codes, turned into something a buyer or the owner can act on.
 * P405 and P411 are called out in SETUP.md section 5 as the two that actually
 * bite: a phone number in the wrong format, and cash on delivery not being
 * enabled on the account.
 */
const CARRIER_MESSAGES: Record<string, string> = {
  P405: "That phone number is not in the right format. It needs the country code, like +357 99 123456.",
  P411: "Cash on delivery is not switched on for this BOX NOW account yet.",
  P400: "BOX NOW would not accept those parcel details.",
  P401: "BOX NOW rejected the login for this shop.",
  P404: "BOX NOW could not find that locker or parcel.",
};

function carrierError(code: string | undefined, fallback: string): ShippingResult<never> {
  return {
    ok: false,
    error: {
      code: "carrier-rejected",
      message: (code && CARRIER_MESSAGES[code]) ?? fallback,
      carrierCode: code,
    },
  };
}

async function getToken(config: BoxNowConfig): Promise<ShippingResult<string>> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return { ok: true, data: cachedToken.token };
  }

  try {
    const response = await fetch(`${config.apiUrl}/api/v1/auth-sessions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: config.clientId,
        client_secret: config.clientSecret,
      }),
    });

    if (!response.ok) {
      return carrierError(undefined, "Could not sign in to BOX NOW.");
    }

    const body: unknown = await response.json();
    const token =
      typeof body === "object" && body !== null && "access_token" in body
        ? String((body as { access_token: unknown }).access_token)
        : null;

    if (!token) return carrierError(undefined, "BOX NOW did not return a usable token.");

    // Their token lives an hour. Cached with a margin so a request cannot go
    // out holding one that expires in flight.
    cachedToken = { token, expiresAt: Date.now() + 3_600_000 - TOKEN_SAFETY_MARGIN_MS };
    return { ok: true, data: token };
  } catch {
    return { ok: false, error: { code: "network", message: "Could not reach BOX NOW." } };
  }
}

export class BoxNowShippingProvider implements ShippingProvider {
  readonly carrier: Carrier = "boxnow";

  constructor(private readonly methods: ShippingMethod[]) {}

  /**
   * Quoting needs no API call: the rates live in our own shipping_methods
   * table, so a locker price still shows before the account exists. Only
   * actually booking a parcel needs credentials.
   */
  async quote(
    cart: ShippingCart,
    destination: ShippingDestination,
  ): Promise<ShippingResult<ReturnType<typeof rateShipping>["quotes"]>> {
    const mine = this.methods.filter((method) => method.carrier === "boxnow");
    const { quotes } = rateShipping(mine, cart, destination.countryCode);
    return { ok: true, data: quotes };
  }

  async createShipment(request: ShipmentRequest): Promise<ShippingResult<Shipment>> {
    const config = readConfig();
    if (!config) return NOT_CONFIGURED;

    if (!request.destination.lockerId) {
      return {
        ok: false,
        error: { code: "invalid-input", message: "Pick a BOX NOW locker first." },
      };
    }

    const originLocationId = process.env.BOXNOW_ORIGIN_LOCATION_ID;
    if (!originLocationId) {
      return {
        ok: false,
        error: {
          code: "not-configured",
          message: "The BOX NOW drop off point is not set. Add it in the admin settings.",
        },
      };
    }

    const token = await getToken(config);
    if (!token.ok) return token;

    try {
      const response = await fetch(`${config.apiUrl}/api/v1/delivery-requests`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token.data}`,
        },
        body: JSON.stringify({
          orderNumber: request.orderNumber,
          invoiceValue: (request.totalCents / 100).toFixed(2),
          paymentMode: request.collectOnDeliveryCents === null ? "prepaid" : "cod",
          amountToBeCollected:
            request.collectOnDeliveryCents === null
              ? undefined
              : (request.collectOnDeliveryCents / 100).toFixed(2),
          origin: { locationId: originLocationId },
          destination: { locationId: request.destination.lockerId },
          items: request.items.map((item) => ({
            id: item.title,
            name: item.title,
            value: (request.totalCents / 100).toFixed(2),
            quantity: item.quantity,
          })),
          // Full international format, per their docs. A local 99xxxxxx is
          // what produces a P405.
          contactNumber: request.recipient.phone,
          contactName: request.recipient.name,
          contactEmail: request.recipient.email,
        }),
      });

      const body: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        const code =
          typeof body === "object" && body !== null && "errorCode" in body
            ? String((body as { errorCode: unknown }).errorCode)
            : undefined;
        return carrierError(code, "BOX NOW would not take that parcel.");
      }

      const parcelId =
        typeof body === "object" && body !== null && "id" in body
          ? String((body as { id: unknown }).id)
          : null;

      if (!parcelId) {
        return carrierError(undefined, "BOX NOW did not return a parcel reference.");
      }

      return {
        ok: true,
        data: {
          reference: parcelId,
          trackingNumber: parcelId,
          trackingUrl: `https://boxnow.cy/track/${encodeURIComponent(parcelId)}`,
          status: "created",
        },
      };
    } catch {
      return { ok: false, error: { code: "network", message: "Could not reach BOX NOW." } };
    }
  }

  async getLabel(
    reference: string,
  ): Promise<ShippingResult<{ pdf: ArrayBuffer } | { unavailable: true }>> {
    const config = readConfig();
    if (!config) return NOT_CONFIGURED;

    const token = await getToken(config);
    if (!token.ok) return token;

    try {
      const response = await fetch(
        `${config.apiUrl}/api/v1/parcels/${encodeURIComponent(reference)}/label.pdf`,
        { headers: { authorization: `Bearer ${token.data}` } },
      );

      if (!response.ok) return carrierError(undefined, "No label available for that parcel yet.");
      return { ok: true, data: { pdf: await response.arrayBuffer() } };
    } catch {
      return { ok: false, error: { code: "network", message: "Could not reach BOX NOW." } };
    }
  }

  async track(reference: string): Promise<ShippingResult<TrackingInfo>> {
    const config = readConfig();
    if (!config) return NOT_CONFIGURED;

    return {
      ok: true,
      data: {
        trackingNumber: reference,
        trackingUrl: `https://boxnow.cy/track/${encodeURIComponent(reference)}`,
        status: null,
      },
    };
  }

  /** Not part of the interface: only the admin cancels a parcel. */
  async cancelParcel(reference: string): Promise<ShippingResult<{ cancelled: true }>> {
    const config = readConfig();
    if (!config) return NOT_CONFIGURED;

    const token = await getToken(config);
    if (!token.ok) return token;

    try {
      const response = await fetch(
        `${config.apiUrl}/api/v1/parcels/${encodeURIComponent(reference)}:cancel`,
        { method: "POST", headers: { authorization: `Bearer ${token.data}` } },
      );
      if (!response.ok) return carrierError(undefined, "BOX NOW would not cancel that parcel.");
      return { ok: true, data: { cancelled: true } };
    } catch {
      return { ok: false, error: { code: "network", message: "Could not reach BOX NOW." } };
    }
  }
}
