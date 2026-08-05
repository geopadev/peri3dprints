import type { Metadata } from "next";
import { Card } from "@/components/ui";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-12">
      <Card className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl">Sign in</h1>
          <p className="mt-2">This is the shop admin. Only the owner can get in.</p>
        </div>

        {error === "link" && (
          <p className="rounded-card border-2 border-magenta p-4">
            That link did not work. It may have been used already or expired. Ask for a new one
            below.
          </p>
        )}

        <LoginForm />
      </Card>
    </main>
  );
}
