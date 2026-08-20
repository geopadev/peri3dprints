import type { Metadata } from "next";
import { Button, Card, Input, Notice, Textarea } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { saveSettings } from "./actions";
import { settingsErrorMessage } from "./messages";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { error, saved } = await searchParams;
  const errorMessage = settingsErrorMessage(error);

  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("settings")
    .select("whatsapp_number, announcement, shop_open, boxnow_origin_location_id")
    .eq("id", 1)
    .maybeSingle();

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-5 py-8">
      <h1 className="text-2xl">Settings</h1>

      {errorMessage && (
        <Notice role="alert">
          <p>{errorMessage}</p>
        </Notice>
      )}

      {saved && !errorMessage && (
        <Notice tone="done" role="status">
          <p>Saved.</p>
        </Notice>
      )}

      <form action={saveSettings} className="flex flex-col gap-6">
        <Card className="flex flex-col gap-3">
          <label className="font-semibold" htmlFor="whatsapp_number">
            WhatsApp number
          </label>
          <Input
            id="whatsapp_number"
            name="whatsapp_number"
            type="tel"
            inputMode="tel"
            defaultValue={settings?.whatsapp_number ?? ""}
            placeholder="+357 99 123456"
          />
          <p className="text-sm">
            Buyers get a button that opens WhatsApp to this number. Change it here, no redeploy
            needed.
          </p>
        </Card>

        <Card className="flex flex-col gap-3">
          <label className="font-semibold" htmlFor="announcement">
            Announcement
          </label>
          <Textarea
            id="announcement"
            name="announcement"
            rows={3}
            defaultValue={settings?.announcement ?? ""}
            placeholder="At the Limassol market this Saturday."
          />
          <p className="text-sm">Shown across the top of the shop. Leave it empty to hide it.</p>
        </Card>

        <Card className="flex flex-col gap-3">
          <label className="flex min-h-11 items-center gap-3">
            <input
              type="checkbox"
              name="shop_open"
              defaultChecked={settings?.shop_open ?? true}
              className="h-6 w-6 accent-flame focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan focus-visible:outline-solid"
            />
            <span className="font-semibold">The shop is open</span>
          </label>
          <p className="text-sm">
            Turn this off when you are away. People can still look, but they cannot order.
          </p>
        </Card>

        <Card className="flex flex-col gap-3">
          <label className="font-semibold" htmlFor="boxnow_origin_location_id">
            BOX NOW origin id
          </label>
          <Input
            id="boxnow_origin_location_id"
            name="boxnow_origin_location_id"
            defaultValue={settings?.boxnow_origin_location_id ?? ""}
          />
          <p className="text-sm">
            Where your parcels are dropped off. BOX NOW give you this when the account is approved,
            so leave it empty until then.
          </p>
        </Card>

        <div>
          <Button type="submit">Save settings</Button>
        </div>
      </form>
    </main>
  );
}
