import type { Metadata } from "next";
import { LegalPage, Todo } from "@/components/shop/legal-page";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What this shop keeps about you and why.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy">
      <p>This is a one person shop. Here is what I keep about you, why, and for how long.</p>
      <Todo>Trader name, trading address and contact email go here before launch.</Todo>
      <h2>What I keep</h2>
      <p>
        Your name, email and phone number when you make an account or place an order, so I can reply
        to you and send what you bought. Your delivery address if you ask for something to be
        posted. The messages we exchange on the site. Pictures you upload for a custom request.
      </p>
      <h2>Why</h2>
      <p>
        To make and send your order, answer your questions, and keep a record of what was sold in
        case of a problem. Nothing else. I do not sell or share your details with anyone, and I do
        not send newsletters.
      </p>
      <h2>Where it lives</h2>
      <p>
        Accounts, orders and messages are stored with Supabase in the EU. The site runs on Vercel.
        Emails are sent through Resend. Each of those keeps only what it needs to do its job.
      </p>
      <h2>Cookies</h2>
      <p>
        Only the cookie that keeps you signed in, and only once you sign in. There is no tracking
        cookie and no advertising, which is why there is no cookie banner.
      </p>
      <h2>How long</h2>
      <p>
        Order records are kept for the time the tax rules require. You can ask me to delete your
        account and messages at any time by messaging me on the site.
      </p>
      <h2>Your rights</h2>
      <p>
        You can ask to see what I hold about you, correct it, or have it deleted. Message me on the
        site or use the email above.
      </p>
    </LegalPage>
  );
}
