"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { Button, Field, Input, Notice, Textarea } from "@/components/ui";
import { useCart } from "@/hooks/use-cart";
import { clear } from "@/lib/cart-store";
import { placeOrder, type PlaceOrderState } from "./actions";

const INITIAL: PlaceOrderState = { status: "idle" };

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled} className="w-full">
      {pending ? "Placing order" : "Place order"}
    </Button>
  );
}

export function AskToBuyForm({
  defaults,
}: {
  defaults: { fullName: string; email: string; phone: string };
}) {
  const { lines } = useCart();
  const router = useRouter();
  const [state, formAction] = useActionState(placeOrder, INITIAL);
  const fieldErrors = state.status === "error" ? state.fieldErrors : undefined;

  // The cart is client side, so it empties here rather than in the action.
  useEffect(() => {
    if (state.status === "done") {
      clear();
      router.replace(`/order/${state.orderNumber}?t=${state.token}`);
    }
  }, [state, router]);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="items" value={JSON.stringify(lines)} />

      {state.status === "error" && <Notice role="alert">{state.message}</Notice>}

      <Field label="Name" error={fieldErrors?.fullName}>
        {(c) => (
          <Input
            {...c}
            name="fullName"
            defaultValue={defaults.fullName}
            autoComplete="name"
            required
            invalid={Boolean(fieldErrors?.fullName)}
          />
        )}
      </Field>
      <Field label="Email" error={fieldErrors?.email}>
        {(c) => (
          <Input
            {...c}
            name="email"
            type="email"
            defaultValue={defaults.email}
            autoComplete="email"
            required
            invalid={Boolean(fieldErrors?.email)}
          />
        )}
      </Field>
      <Field label="Phone" hint="So I can reach you about the order." error={fieldErrors?.phone}>
        {(c) => (
          <Input
            {...c}
            name="phone"
            type="tel"
            defaultValue={defaults.phone || "+357 "}
            autoComplete="tel"
            required
            invalid={Boolean(fieldErrors?.phone)}
          />
        )}
      </Field>
      <Field
        label="Anything I should know"
        hint="Colour, size, when you need it. Optional."
        error={fieldErrors?.note}
      >
        {(c) => <Textarea {...c} name="note" rows={3} invalid={Boolean(fieldErrors?.note)} />}
      </Field>

      <p className="text-sm">
        No payment yet. I will send you a payment link in our conversation once I have checked the
        order, and we sort out posting or collecting there too.
      </p>

      <SubmitButton disabled={lines.length === 0} />
    </form>
  );
}
