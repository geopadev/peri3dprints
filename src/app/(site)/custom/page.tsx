import type { Metadata } from "next";
import { Card } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/products";
import { whatsappLink } from "@/lib/whatsapp-link";
import { CustomForm } from "./custom-form";

export const metadata: Metadata = {
  title: "Ask for a custom print",
  description:
    "Tell me what you want printed and I will tell you if I can do it, and what it costs.",
};

export default async function CustomPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const settings = await getSettings();
  const whatsappHref = settings.whatsappNumber
    ? whatsappLink(settings.whatsappNumber, "Hi, I want to ask about a custom print.")
    : null;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-8">
      <div>
        <h1 className="text-2xl">Ask for a custom print</h1>
        <p className="mt-3">
          I print in PLA and PETG on a home printer, so the biggest single piece is about 22 cm on
          each side. Bigger things print in parts. Fine detail comes out well, hollow thin walls do
          not, and anything that has to hold real weight or heat is better made another way.
        </p>
        <p className="mt-3">
          Tell me what you have in mind and I will say honestly whether it will print well and what
          it would cost. Quotes are free. I usually reply within a day or two.
        </p>
      </div>

      <Card>
        {user ? (
          <CustomForm uploadPrefix={user.id} />
        ) : (
          <div className="flex flex-col gap-3">
            <p>Sign in first so I can reply to you here. Your form will be waiting.</p>
            <a href="/sign-in?next=%2Fcustom" className="font-semibold underline">
              Sign in
            </a>
          </div>
        )}
      </Card>

      {whatsappHref && (
        <p className="text-sm">
          Prefer WhatsApp?{" "}
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            className="font-semibold underline"
          >
            Message me there
          </a>{" "}
          instead.
        </p>
      )}

      {/* Said once, here, where it matters, per the brief. */}
      <p className="text-sm">
        Custom made items are excluded from the EU 14 day right of withdrawal, because they are made
        for you and cannot be sold to anyone else.
      </p>
    </main>
  );
}
