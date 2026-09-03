import type { Metadata } from "next";
import { LegalPage } from "@/components/shop/legal-page";

export const metadata: Metadata = {
  title: "Returns",
  description: "What happens if something is wrong.",
};

export default function ReturnsPage() {
  return (
    <LegalPage title="Returns">
      <h2>Damaged or wrong</h2>
      <p>
        Message me within 14 days of it arriving, with a photo. I will reprint it or refund you,
        whichever you prefer, and cover the return postage if I need it back.
      </p>
      <h2>Changed your mind</h2>
      <p>
        For a print from the shop, you have 14 days from delivery to tell me you want to return it,
        and 14 more to send it back unused. You pay the return postage. I refund once it arrives.
      </p>
      <h2>Custom prints</h2>
      <p>
        Custom made items are excluded from the right of withdrawal, since they are made for you. If
        one is faulty the damaged or wrong rule above still applies.
      </p>
      <h2>Refunds</h2>
      <p>Refunds go back the same way you paid, within a few days of my agreeing to it.</p>
    </LegalPage>
  );
}
