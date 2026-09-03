import type { Metadata } from "next";
import { LegalPage, Todo } from "@/components/shop/legal-page";

export const metadata: Metadata = {
  title: "Terms",
  description: "How buying from this shop works.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms">
      <Todo>Trader name, address and VAT status (registered or not) go here before launch.</Todo>
      <h2>How an order works</h2>
      <p>
        You ask to buy, I check the order and send you a payment link in our conversation on the
        site. The order is confirmed when I have seen the payment arrive and told you so. Until then
        nothing is owed.
      </p>
      <h2>Prices</h2>
      <p>
        Prices are in euros and include any tax that applies. Posting costs are shown before you
        confirm. If a price on the site is plainly a mistake I will tell you before taking payment
        rather than hold you to it.
      </p>
      <h2>Made to order</h2>
      <p>
        Most prints are made after you order. The time shown on the product page is an estimate. If
        it is going to be later I will tell you.
      </p>
      <h2>Custom prints</h2>
      <p>
        A custom print is made to your description. I will tell you honestly if I do not think
        something will print well. Custom made items are excluded from the EU 14 day right of
        withdrawal.
      </p>
      <h2>If something is wrong</h2>
      <p>
        If a print arrives damaged or is not what you ordered, message me within 14 days with a
        photo and I will reprint it or refund you. See the returns page.
      </p>
      <h2>Law</h2>
      <p>These terms are under the law of the Republic of Cyprus.</p>
    </LegalPage>
  );
}
