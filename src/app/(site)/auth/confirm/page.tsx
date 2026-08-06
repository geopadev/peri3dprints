import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui";
import { emailSchema } from "@/lib/validation/auth";
import { safeNext } from "@/lib/safe-next";
import { ResendButton } from "./resend-button";

export const metadata: Metadata = {
  title: "Check your inbox",
};

export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; next?: string }>;
}) {
  const { email: rawEmail, next: rawNext } = await searchParams;
  const email = emailSchema.safeParse(rawEmail);

  // Landing here without a valid email means someone typed the URL by hand
  // rather than arriving from sign up, so send them back to start properly.
  if (!email.success) redirect("/sign-up");

  const next = safeNext(rawNext);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-12">
      <Card className="flex flex-col gap-4">
        <h1 className="text-2xl">Check your inbox</h1>
        <p>
          We sent a link to <span className="font-mono">{email.data}</span>. Open it on this device
          and you will be signed in. The link works once.
        </p>
        <ResendButton email={email.data} next={next} />
      </Card>
    </main>
  );
}
