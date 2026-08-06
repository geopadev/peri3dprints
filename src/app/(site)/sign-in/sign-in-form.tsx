"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button, Field, Input } from "@/components/ui";
import { signIn, type SignInState } from "./actions";

const INITIAL: SignInState = { status: "idle" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Signing in" : "Sign in"}
    </Button>
  );
}

export function SignInForm({ next }: { next: string }) {
  const [state, formAction] = useActionState(signIn, INITIAL);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="next" value={next} />

      <Field label="Email" error={state.status === "error" ? state.message : undefined}>
        {(control) => (
          <Input
            {...control}
            name="email"
            type="email"
            autoComplete="email"
            required
            invalid={state.status === "error"}
            placeholder="you@example.com"
          />
        )}
      </Field>

      <Field label="Password">
        {(control) => (
          <Input
            {...control}
            name="password"
            type="password"
            autoComplete="current-password"
            required
            invalid={state.status === "error"}
          />
        )}
      </Field>

      <SubmitButton />

      <p className="text-sm">
        Forgot it?{" "}
        <Link href="/forgot-password" className="font-semibold underline">
          Reset your password
        </Link>
        .
      </p>

      <p className="text-sm">
        Trouble signing in after signing up? Check your inbox for a confirmation email.
      </p>
    </form>
  );
}
