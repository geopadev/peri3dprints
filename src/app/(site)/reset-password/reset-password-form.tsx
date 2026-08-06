"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button, Field, Input } from "@/components/ui";
import { resetPassword, type ResetPasswordState } from "./actions";

const INITIAL: ResetPasswordState = { status: "idle" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Saving" : "Set new password"}
    </Button>
  );
}

export function ResetPasswordForm() {
  const [state, formAction] = useActionState(resetPassword, INITIAL);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <Field
        label="New password"
        hint="At least 8 characters. Length is what matters, not symbols."
        error={state.status === "error" ? state.message : undefined}
      >
        {(control) => (
          <Input
            {...control}
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            invalid={state.status === "error"}
          />
        )}
      </Field>

      <SubmitButton />
    </form>
  );
}
