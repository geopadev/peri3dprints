import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Button, Card } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./login/actions";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  // The middleware already checked this. Checking again here is deliberate:
  // middleware is a convenience redirect, not the security boundary, and every
  // admin page should be able to stand on its own.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.is_anonymous) redirect("/admin/login");

  const { data: isOwner } = await supabase.rpc("is_owner");
  if (!isOwner) redirect("/admin/not-owner");

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-5 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl">Admin</h1>
          <p className="mt-2">
            Signed in as <span className="font-mono">{user.email}</span>.
          </p>
        </div>
        <form action={signOut}>
          <Button type="submit" variant="ghost">
            Sign out
          </Button>
        </form>
      </div>

      <Card>
        <p>Nothing is built here yet. Products, orders and messages come next.</p>
      </Card>
    </main>
  );
}
