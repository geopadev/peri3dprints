import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = {
  title: "Set a new password",
};

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-12">
      <Card className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl">Set a new password</h1>
        </div>

        {user ? (
          <ResetPasswordForm />
        ) : (
          <div className="flex flex-col gap-3">
            <p>This link did not work. It may have been used already or expired.</p>
            <p className="text-sm">
              <Link href="/forgot-password" className="font-semibold underline">
                Request a new one
              </Link>
            </p>
          </div>
        )}
      </Card>
    </main>
  );
}
