"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button, Field, Input } from "@/components/ui";
import { sendMagicLink, type LoginState } from "./actions";

const INITIAL: LoginState = { status: "idle" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Sending" : "Send me a link"}
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState(sendMagicLink, INITIAL);

  if (state.status === "sent") {
    return (
      <div className="flex flex-col gap-3">
        <h2 className="text-lg">Check your email</h2>
        <p>
          I sent a link to <span className="font-mono">{state.email}</span>. Open it on this device
          and you will be signed in. The link works once and expires after an hour.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <Field
        label="Email"
        hint="No password. I email you a link that signs you in."
        error={state.status === "error" ? state.message : undefined}
      >
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
