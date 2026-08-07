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
 * ACS and Cyprus Post. Neither has an API this shop can realistically get on
 * to, so the owner books the parcel in the carrier's own portal and pastes the
 * tracking number into the admin. See SETUP.md section 5.
 *
 * This is a first class provider, not a placeholder: a manual booking is how
 * most of these parcels will actually move for a while.
 */
const TRACKING_URL_TEMPLATE: Record<string, string> = {
  acs: "https://www.acscourier.net/en/track-and-trace/?tracking_number={tracking}",
  cypost: "https://www.cypruspost.post/en/track-and-trace?code={tracking}",
};

export function trackingUrlFor(carrier: Carrier, trackingNumber: string): string | null {
  const template = TRACKING_URL_TEMPLATE[carrier];
  if (!template) return null;
  return template.replace("{tracking}", encodeURIComponent(trackingNumber));
}

export class ManualShippingProvider implements ShippingProvider {
  constructor(
    readonly carrier: Carrier,
    private readonly methods: ShippingMethod[],
  ) {}

  async quote(
    cart: ShippingCart,
    destination: ShippingDestination,
  ): Promise<ShippingResult<ReturnType<typeof rateShipping>["quotes"]>> {
    const mine = this.methods.filter((method) => method.carrier === this.carrier);
    const { quotes } = rateShipping(mine, cart, destination.countryCode);
    return { ok: true, data: quotes };
  }

  /**
   * Nothing is booked with the carrier here, because there is no API to book
   * with. The shipment starts pending and becomes real when the owner enters
   * the tracking number he got at the counter.
   */
  async createShipment(request: ShipmentRequest): Promise<ShippingResult<Shipment>> {
    return {
      ok: true,
      data: {
        reference: request.orderNumber,
        trackingNumber: null,
        trackingUrl: null,
        status: "pending",
      },
    };
  }

  async getLabel(): Promise<ShippingResult<{ unavailable: true }>> {
    // The carrier prints the label at the counter. There is nothing to fetch.
    return { ok: true, data: { unavailable: true } };
  }

  async track(reference: string): Promise<ShippingResult<TrackingInfo>> {
    if (!reference) {
      return {
        ok: false,
        error: {
          code: "invalid-input",
          message: "No tracking number yet. It appears once the parcel is booked.",
        },
      };
    }

    return {
      ok: true,
      data: {
        trackingNumber: reference,
        trackingUrl: trackingUrlFor(this.carrier, reference),
        status: null,
      },
    };
  }
}
