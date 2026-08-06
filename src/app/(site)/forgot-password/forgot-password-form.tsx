"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button, Field, Input } from "@/components/ui";
import { requestPasswordReset, type ForgotPasswordState } from "./actions";

const INITIAL: ForgotPasswordState = { status: "idle" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Sending" : "Send reset link"}
    </Button>
  );
}

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(requestPasswordReset, INITIAL);

  if (state.status === "sent") {
    return (
      <p>
        If an account exists for that email, we have sent a link to reset the password. Open it on
        this device.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
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

      <SubmitButton />
    </form>
  );
}
