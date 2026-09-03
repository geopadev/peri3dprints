import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { AskToBuyForm } from "./ask-to-buy-form";

export const metadata: Metadata = { title: "Ask to buy", robots: { index: false, follow: false } };

export default async function AskToBuyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=%2Fask-to-buy");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, email, phone")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-5 px-5 py-8">
      <h1 className="text-2xl">Ask to buy</h1>
      <p>
        Just the little I need to get started. Prices are worked out from the shop, not from here.
      </p>
      <Card>
        <AskToBuyForm
          defaults={{
            fullName: profile?.display_name ?? "",
            email: profile?.email ?? user.email ?? "",
            phone: profile?.phone ?? "",
          }}
        />
      </Card>
    </main>
  );
}
