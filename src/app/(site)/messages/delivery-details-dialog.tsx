"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
  Field,
  Input,
  Notice,
  Select,
} from "@/components/ui";
import { saveDeliveryDetails, type DeliveryState } from "./delivery-actions";

const INITIAL: DeliveryState = { status: "idle" };

const COUNTRIES: [string, string][] = [
  ["CY", "Cyprus"],
  ["GR", "Greece"],
  ["GB", "United Kingdom"],
  ["DE", "Germany"],
  ["FR", "France"],
  ["IT", "Italy"],
  ["ES", "Spain"],
  ["NL", "Netherlands"],
  ["BE", "Belgium"],
  ["AT", "Austria"],
  ["IE", "Ireland"],
  ["PT", "Portugal"],
  ["SE", "Sweden"],
  ["DK", "Denmark"],
  ["PL", "Poland"],
  ["US", "United States"],
  ["AU", "Australia"],
  ["CA", "Canada"],
];

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving" : "Save delivery details"}
    </Button>
  );
}

/**
 * Opened from inside the conversation, so the buyer never loses the thread.
 * Radix Dialog handles the focus trap. Choosing collection needs no address
 * and zeroes the shipping cost; posting re-quotes it server side.
 */
export function DeliveryDetailsButton({
  orderId,
  conversationId,
}: {
  orderId: string;
  conversationId: string;
}) {
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<"post" | "collect">("post");
  const [state, formAction] = useActionState(saveDeliveryDetails, INITIAL);
  const router = useRouter();
  const fe = state.status === "error" ? state.fieldErrors : undefined;

  useEffect(() => {
    if (state.status === "done") {
      setOpen(false);
      router.refresh();
    }
  }, [state, router]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="w-full">
          Add delivery details
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Where should it go</DialogTitle>
        <DialogDescription>
          Posting costs are worked out from the shop, not from this form.
        </DialogDescription>
        <form action={formAction} className="mt-5 flex flex-col gap-4">
          <input type="hidden" name="orderId" value={orderId} />
          <input type="hidden" name="conversationId" value={conversationId} />
          {state.status === "error" && <Notice role="alert">{state.message}</Notice>}

          <fieldset className="flex flex-col gap-2">
            <legend className="font-semibold">How do you want it</legend>
            <label className="flex min-h-11 items-center gap-2">
              <input
                type="radio"
                name="method"
                value="post"
                checked={method === "post"}
                onChange={() => setMethod("post")}
                className="h-5 w-5 accent-ink"
              />
              Post it to me
            </label>
            <label className="flex min-h-11 items-center gap-2">
              <input
                type="radio"
                name="method"
                value="collect"
                checked={method === "collect"}
                onChange={() => setMethod("collect")}
                className="h-5 w-5 accent-ink"
              />
              I will collect it at a market
            </label>
          </fieldset>

          {method === "post" && (
            <>
              <Field label="Name on the parcel" error={fe?.fullName}>
                {(c) => (
                  <Input
                    {...c}
                    name="fullName"
                    autoComplete="name"
                    invalid={Boolean(fe?.fullName)}
                  />
                )}
              </Field>
              <Field label="Phone for the courier" error={fe?.phone}>
                {(c) => (
                  <Input
                    {...c}
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    invalid={Boolean(fe?.phone)}
                  />
                )}
              </Field>
              <Field label="Street address" error={fe?.line1}>
                {(c) => (
                  <Input
                    {...c}
                    name="line1"
                    autoComplete="address-line1"
                    invalid={Boolean(fe?.line1)}
                  />
                )}
              </Field>
              <Field label="Flat, building, other" hint="Optional.">
                {(c) => <Input {...c} name="line2" autoComplete="address-line2" />}
              </Field>
              <Field label="Town or city" error={fe?.city}>
                {(c) => (
                  <Input
                    {...c}
                    name="city"
                    autoComplete="address-level2"
                    invalid={Boolean(fe?.city)}
                  />
                )}
              </Field>
              <Field label="Postal code" error={fe?.postalCode}>
                {(c) => (
                  <Input
                    {...c}
                    name="postalCode"
                    autoComplete="postal-code"
                    invalid={Boolean(fe?.postalCode)}
                  />
                )}
              </Field>
              <Field label="Country" error={fe?.countryCode}>
                {(c) => (
                  <Select
                    {...c}
                    name="countryCode"
                    defaultValue="CY"
                    invalid={Boolean(fe?.countryCode)}
                  >
                    {COUNTRIES.map(([code, name]) => (
                      <option key={code} value={code}>
                        {name}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
            </>
          )}

          <DialogFooter>
            <Submit />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
