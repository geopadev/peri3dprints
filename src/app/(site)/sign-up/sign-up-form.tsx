"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button, Field, Input } from "@/components/ui";
import { signUp, type SignUpState } from "./actions";

const INITIAL: SignUpState = { status: "idle" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Creating account" : "Create account"}
    </Button>
  );
}

export function SignUpForm({ next }: { next: string }) {
  const [state, formAction] = useActionState(signUp, INITIAL);
  const fieldErrors = state.status === "error" ? state.fieldErrors : undefined;

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="next" value={next} />

      {state.status === "error" && (
        <p className="rounded-card border-2 border-magenta p-3">{state.message}</p>
      )}

      <Field label="What should we call you" error={fieldErrors?.display_name}>
        {(control) => (
          <Input
            {...control}
            name="display_name"
            autoComplete="name"
            required
            invalid={Boolean(fieldErrors?.display_name)}
            placeholder="Andreas"
          />
        )}
      </Field>

      <Field label="Email" error={fieldErrors?.email}>
        {(control) => (
          <Input
            {...control}
            name="email"
            type="email"
            autoComplete="email"
            required
            invalid={Boolean(fieldErrors?.email)}
            placeholder="you@example.com"
          />
        )}
      </Field>

      <Field
        label="Password"
        hint="At least 8 characters. Length is what matters, not symbols."
        error={fieldErrors?.password}
      >
        {(control) => (
          <Input
            {...control}
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            invalid={Boolean(fieldErrors?.password)}
          />
        )}
      </Field>

      <SubmitButton />
    </form>
  );
}
