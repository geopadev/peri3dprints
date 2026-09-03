import type { Metadata } from "next";
import { LegalPage } from "@/components/shop/legal-page";

export const metadata: Metadata = {
  title: "Delivery",
  description: "How and when prints get to you.",
};

export default function ShippingPage() {
  return (
    <LegalPage title="Delivery">
      <h2>Collecting</h2>
      <p>
        The cheapest way is to collect at a market. I post where I will be in the announcement at
        the top of the site. Collecting costs nothing.
      </p>
      <h2>Posting in Cyprus</h2>
      <p>
        ACS to your door or to an ACS point, BOX NOW lockers, or Cyprus Post. Usually a day or two
        once it is posted. The cost is worked out from the weight and shown in the conversation once
        you give me an address.
      </p>
      <h2>Posting abroad</h2>
      <p>
        Cyprus Post to the EU and worldwide. It is slower and you may have to pay import charges on
        arrival in some countries, which I cannot control.
      </p>
      <h2>Tracking</h2>
      <p>You get a tracking number by email and on your order page as soon as it is posted.</p>
    </LegalPage>
  );
}
