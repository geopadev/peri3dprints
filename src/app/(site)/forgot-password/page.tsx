import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = {
  title: "Reset your password",
};

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-12">
      <Card className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl">Reset your password</h1>
          <p className="mt-2">Tell us your email and we will send you a link.</p>
        </div>

        <ForgotPasswordForm />

        <p className="text-sm">
          <Link href="/sign-in" className="font-semibold underline">
            Back to sign in
          </Link>
        </p>
      </Card>
    </main>
  );
}
