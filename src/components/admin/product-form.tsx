"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  Field,
  Input,
  Notice,
  Select,
  SpecStrip,
  Textarea,
  UTILITY_TEXT,
} from "@/components/ui";
import { ImageUploader } from "./image-uploader";
import { VariantsEditor } from "./variants-editor";
import {
  slugify,
  type ProductImageInput,
  type ProductVariantInput,
} from "@/lib/validation/product";
import type { SaveResult } from "@/app/admin/(shell)/products/actions";

const AUTOSAVE_MS = 20_000;

export type ProductFormValues = {
  id: string | null;
  title: string;
  slug: string;
  short_description: string;
  description: string;
  price: string;
  compare_at: string;
  status: "draft" | "active" | "archived";
  made_to_order: boolean;
  lead_time_days: string;
  stock_qty: string;
  material: string;
  weight_grams: string;
  length_mm: string;
  width_mm: string;
  height_mm: string;
  print_minutes: string;
  spec_note: string;
  category_id: string;
  tags: string;
  featured: boolean;
  images: ProductImageInput[];
  variants: ProductVariantInput[];
};

export type ProductFormProps = {
  initial: ProductFormValues;
  categories: { id: string; name: string }[];
  onSave: (values: ProductFormValues) => Promise<SaveResult>;
};

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * Section order follows the brief, which follows how he thinks at the table:
 * photos first, then what it is, then the specs, then the fiddly bits.
 */
export function ProductForm({ initial, categories, onSave }: ProductFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<ProductFormValues>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Autosave compares against the last saved snapshot, so it stays quiet when
  // nothing changed rather than writing every 20 seconds regardless.
  const lastSaved = useRef(JSON.stringify(initial));
  const slugEdited = useRef(initial.slug !== "" && initial.slug !== slugify(initial.title));

  function set<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((current) => {
      const next = { ...current, [key]: value };
      // Slug follows the title until the owner takes it over.
      if (key === "title" && !slugEdited.current) next.slug = slugify(String(value));
      return next;
    });
  }

  async function save(next: ProductFormValues, quiet: boolean) {
    const result = await onSave(next);

    if (result.status === "error") {
      setErrors(result.fieldErrors ?? {});
      setMessage(result.message);
      return;
    }

    setErrors({});
    setMessage(null);
    setSavedAt(result.savedAt);
    lastSaved.current = JSON.stringify({ ...next, id: result.id });

    if (!next.id) {
      // First save of a new product: move to its real URL so a reload does not
      // create a second one.
      router.replace(`/admin/products/${result.id}`);
      setValues((current) => ({ ...current, id: result.id }));
    } else if (!quiet) {
      router.refresh();
    }
  }

  // Autosave, so a phone call behind the stall does not lose his work.
  useEffect(() => {
    const timer = setInterval(() => {
      if (pending) return;
      const snapshot = JSON.stringify(values);
      if (snapshot === lastSaved.current) return;
      if (!values.title.trim() || !values.price.trim()) return;
      startTransition(() => void save({ ...values, status: values.status }, true));
    }, AUTOSAVE_MS);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, pending]);

  function submit(status: ProductFormValues["status"]) {
    const next = { ...values, status };
    setValues(next);
    startTransition(() => void save(next, false));
  }

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        submit(values.status);
      }}
    >
      {message && (
        <Notice role="alert">
          <p>{message}</p>
        </Notice>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-xl">Photos</h2>
        <ImageUploader images={values.images} onChange={(images) => set("images", images)} />
        {errors.images && <p className="font-semibold">{errors.images}</p>}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl">What it is</h2>

        <Field label="Name" error={errors.title}>
          {(control) => (
            <Input
              {...control}
              value={values.title}
              onChange={(event) => set("title", event.target.value)}
              placeholder="Articulated dragon"
              invalid={Boolean(errors.title)}
            />
          )}
        </Field>

        <Field
          label="Web address"
          hint="This is the end of the link people share. It follows the name until you change it."
          error={errors.slug}
        >
          {(control) => (
            <Input
              {...control}
              value={values.slug}
              onChange={(event) => {
                slugEdited.current = true;
                set("slug", event.target.value);
              }}
              invalid={Boolean(errors.slug)}
            />
          )}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Price" hint="In euro, like 12.50." error={errors.price_cents}>
            {(control) => (
              <Input
                {...control}
                inputMode="decimal"
                value={values.price}
                onChange={(event) => set("price", event.target.value)}
                placeholder="12.50"
                invalid={Boolean(errors.price_cents)}
              />
            )}
          </Field>

          <Field
            label="Was"
            hint="Optional. Shows as a crossed out price."
            error={errors.compare_at_cents}
          >
            {(control) => (
              <Input
                {...control}
                inputMode="decimal"
                value={values.compare_at}
                onChange={(event) => set("compare_at", event.target.value)}
                invalid={Boolean(errors.compare_at_cents)}
              />
            )}
          </Field>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl">Specs</h2>
        <p>
          This is the row of facts under the photo. Fill in what you know, skip what you do not.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Material">
            {(control) => (
              <Input
                {...control}
                value={values.material}
                onChange={(event) => set("material", event.target.value)}
                placeholder="PLA"
              />
            )}
          </Field>

          <Field label="Weight in grams">
            {(control) => (
              <Input
                {...control}
                type="number"
                inputMode="numeric"
                min={0}
                value={values.weight_grams}
                onChange={(event) => set("weight_grams", event.target.value)}
              />
            )}
          </Field>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="font-semibold">Size in millimetres</legend>
          <div className="grid grid-cols-3 gap-3">
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              aria-label="Length in millimetres"
              placeholder="L"
              value={values.length_mm}
              onChange={(event) => set("length_mm", event.target.value)}
            />
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              aria-label="Width in millimetres"
              placeholder="W"
              value={values.width_mm}
              onChange={(event) => set("width_mm", event.target.value)}
            />
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              aria-label="Height in millimetres"
              placeholder="H"
              value={values.height_mm}
              onChange={(event) => set("height_mm", event.target.value)}
            />
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Print time in minutes">
            {(control) => (
              <Input
                {...control}
                type="number"
                inputMode="numeric"
                min={0}
                value={values.print_minutes}
                onChange={(event) => set("print_minutes", event.target.value)}
              />
            )}
          </Field>

          <Field label="Note" hint="Something short, like articulated or prints in place.">
            {(control) => (
              <Input
                {...control}
                value={values.spec_note}
                onChange={(event) => set("spec_note", event.target.value)}
                placeholder="Articulated"
              />
            )}
          </Field>
        </div>

        <Card>
          <p className={`mb-2 ${UTILITY_TEXT}`}>How it will read</p>
          <SpecStrip
            material={values.material || undefined}
            dimensionsMm={
              values.length_mm && values.width_mm && values.height_mm
                ? [Number(values.length_mm), Number(values.width_mm), Number(values.height_mm)]
                : undefined
            }
            weightGrams={values.weight_grams ? Number(values.weight_grams) : undefined}
            printMinutes={values.print_minutes ? Number(values.print_minutes) : undefined}
            note={values.spec_note || undefined}
          />
        </Card>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl">Words</h2>

        <Field label="Short line" hint="One sentence, shown under the name in the shop.">
          {(control) => (
            <Input
              {...control}
              value={values.short_description}
              onChange={(event) => set("short_description", event.target.value)}
              placeholder="Made to order, ready in about 3 days."
            />
          )}
        </Field>

        <Field label="Description">
          {(control) => (
            <Textarea
              {...control}
              rows={6}
              value={values.description}
              onChange={(event) => set("description", event.target.value)}
            />
          )}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category">
            {(control) => (
              <Select
                {...control}
                value={values.category_id}
                onChange={(event) => set("category_id", event.target.value)}
              >
                <option value="">No category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field label="Tags" hint="Separated by commas.">
            {(control) => (
              <Input
                {...control}
                value={values.tags}
                onChange={(event) => set("tags", event.target.value)}
                placeholder="dragon, articulated"
              />
            )}
          </Field>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl">Options</h2>
        <VariantsEditor variants={values.variants} onChange={(v) => set("variants", v)} />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl">Stock</h2>

        <label className="flex min-h-11 items-center gap-3">
          <input
            type="checkbox"
            checked={values.made_to_order}
            onChange={(event) => set("made_to_order", event.target.checked)}
            className="h-6 w-6 accent-flame focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan focus-visible:outline-solid"
          />
          <span className="font-semibold">I print this one to order</span>
        </label>

        {values.made_to_order ? (
          <Field label="Ready in, days" hint="Roughly how long before you can post it.">
            {(control) => (
              <Input
                {...control}
                type="number"
                inputMode="numeric"
                min={0}
                value={values.lead_time_days}
                onChange={(event) => set("lead_time_days", event.target.value)}
              />
            )}
          </Field>
        ) : (
          <Field label="How many you have">
            {(control) => (
              <Input
                {...control}
                type="number"
                inputMode="numeric"
                min={0}
                value={values.stock_qty}
                onChange={(event) => set("stock_qty", event.target.value)}
              />
            )}
          </Field>
        )}
      </section>

      <div className="sticky bottom-16 flex flex-col gap-2 border-t-2 border-ink bg-paper py-4 sm:bottom-0">
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="secondary"
            disabled={pending}
            onClick={() => submit("draft")}
          >
            Save draft
          </Button>
          <Button type="button" disabled={pending} onClick={() => submit("active")}>
            Put on the shelf
          </Button>
        </div>
        <p className={UTILITY_TEXT} aria-live="polite">
          {pending ? "Saving" : savedAt ? `Saved ${timeLabel(savedAt)}` : "Not saved yet"}
        </p>
      </div>
    </form>
  );
}
