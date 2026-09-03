"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button, Field, Input, Notice, Textarea } from "@/components/ui";
import { AttachmentPicker } from "@/app/(site)/messages/attachment-picker";
import { submitCustomRequest, type CustomState } from "./actions";

const INITIAL: CustomState = { status: "idle" };

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Sending" : "Send the request"}
    </Button>
  );
}

export function CustomForm({ uploadPrefix }: { uploadPrefix: string }) {
  const [state, formAction] = useActionState(submitCustomRequest, INITIAL);
  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state.status === "error" && <Notice role="alert">{state.message}</Notice>}
      <Field label="What do you want" hint="Describe it, or link to something like it.">
        {(c) => (
          <Textarea
            {...c}
            name="what"
            rows={5}
            required
            placeholder="A phone stand shaped like a cat, about the size of my hand"
          />
        )}
      </Field>
      <Field label="Rough size" hint="Optional. Centimetres is fine.">
        {(c) => <Input {...c} name="sizeNote" placeholder="About 10 cm tall" />}
      </Field>
      <Field label="Colour" hint="Optional.">
        {(c) => <Input {...c} name="colourPref" placeholder="Dark green if you have it" />}
      </Field>
      <Field label="Budget in euros" hint="Optional. Helps me tell you what is possible.">
        {(c) => <Input {...c} name="budget" inputMode="decimal" placeholder="20" />}
      </Field>
      <Field label="When you need it by" hint="Optional.">
        {(c) => <Input {...c} name="deadline" type="date" />}
      </Field>
      <div className="flex flex-col gap-2">
        <p className="font-semibold">Reference pictures</p>
        <p className="text-sm">
          Up to five. Photos, sketches, screenshots, anything that shows what you mean.
        </p>
        <AttachmentPicker conversationId={uploadPrefix} bucket="custom-request-uploads" max={5} />
      </div>
      <Submit />
    </form>
  );
}
