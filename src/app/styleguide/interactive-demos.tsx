"use client";

import { useState } from "react";
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
  Field,
  Input,
  Select,
  Textarea,
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui";

/**
 * Field uses useId and takes a render prop, so it only works inside a Client
 * Component. That matches how it will really be used, since every form in this
 * project runs on react-hook-form.
 */
export function FieldDemos() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Field label="Your name">{(control) => <Input {...control} placeholder="Andreas" />}</Field>

      <Field label="Email" required hint="I only use this to reply about your order.">
        {(control) => <Input {...control} type="email" placeholder="you@example.com" />}
      </Field>

      <Field label="Phone" error="That number is too short. Cyprus numbers are 8 digits.">
        {(control) => <Input {...control} invalid defaultValue="9912" />}
      </Field>

      <Field label="Colour" hint="Message me if you want something not listed.">
        {(control) => (
          <Select {...control} defaultValue="orange">
            <option value="orange">Filament orange</option>
            <option value="black">Black</option>
            <option value="lime">Lime</option>
          </Select>
        )}
      </Field>

      <Field label="Postcode" hint="Disabled until you pick a country.">
        {(control) => <Input {...control} disabled placeholder="2001" />}
      </Field>

      <Field
        label="What do you want printed"
        hint="Rough is fine. Sizes and colours help."
        className="md:col-span-2"
      >
        {(control) => (
          <Textarea {...control} placeholder="A dragon about 10cm tall, in lime if you have it." />
        )}
      </Field>

      <Field label="Notes" error="Say a bit more so I can quote it." className="md:col-span-2">
        {(control) => <Textarea {...control} invalid defaultValue="hi" />}
      </Field>
    </div>
  );
}

export function DialogDemo() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary">Open dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Remove this print</DialogTitle>
        <DialogDescription>
          It comes off the shop straight away. Orders already placed keep working.
        </DialogDescription>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Keep it</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button variant="danger">Remove print</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ToastDemo() {
  const [neutral, setNeutral] = useState(false);
  const [success, setSuccess] = useState(false);
  const [problem, setProblem] = useState(false);

  return (
    <ToastProvider swipeDirection="right">
      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" onClick={() => setNeutral(true)}>
          Neutral toast
        </Button>
        <Button variant="secondary" onClick={() => setSuccess(true)}>
          Success toast
        </Button>
        <Button variant="secondary" onClick={() => setProblem(true)}>
          Problem toast
        </Button>
      </div>

      <Toast open={neutral} onOpenChange={setNeutral} className="relative">
        <ToastTitle>Saved</ToastTitle>
        <ToastDescription>Your changes are live.</ToastDescription>
        <ToastClose>×</ToastClose>
      </Toast>

      <Toast open={success} onOpenChange={setSuccess} tone="success" className="relative">
        <ToastTitle>Order marked shipped</ToastTitle>
        <ToastDescription>The buyer just got an email.</ToastDescription>
        <ToastClose>×</ToastClose>
      </Toast>

      <Toast open={problem} onOpenChange={setProblem} tone="problem" className="relative">
        <ToastTitle>Card was declined</ToastTitle>
        <ToastDescription>Try another card or pick cash on delivery.</ToastDescription>
        <ToastAction altText="Try the payment again" asChild>
          <button className="mt-3 font-semibold underline">Try again</button>
        </ToastAction>
        <ToastClose>×</ToastClose>
      </Toast>

      <ToastViewport />
    </ToastProvider>
  );
}
