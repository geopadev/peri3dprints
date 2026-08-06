import type { Metadata } from "next";
import { Card } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/supabase/require-session";
import { ChangePasswordForm } from "./change-password-form";

export const metadata: Metadata = {
  title: "Your account",
};

export default async function AccountPage() {
  const user = await requireSession("/account");
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 px-5 py-12">
      <h1 className="text-2xl">Your account</h1>

      <Card className="flex flex-col gap-3">
        <div>
          <p className="font-mono text-xs tracking-utility uppercase">Name</p>
          <p className="mt-1">{profile?.display_name ?? "Not set"}</p>
        </div>
        <div>
          <p className="font-mono text-xs tracking-utility uppercase">Email</p>
          <p className="mt-1">{user.email}</p>
        </div>
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="text-xl">Change password</h2>
        <ChangePasswordForm />
      </Card>
    </main>
  );
}
