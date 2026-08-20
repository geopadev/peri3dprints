"use client";

import { Button, Field, Input, UTILITY_TEXT } from "@/components/ui";
import type { ProductVariantInput } from "@/lib/validation/product";

export type VariantsEditorProps = {
  variants: ProductVariantInput[];
  onChange: (variants: ProductVariantInput[]) => void;
};

function blank(position: number): ProductVariantInput {
  return {
    id: null,
    option_label: "Colour",
    name: "",
    swatch_hex: null,
    price_delta_cents: 0,
    stock_qty: null,
    sku: null,
    position,
  };
}

export function VariantsEditor({ variants, onChange }: VariantsEditorProps) {
  function update(index: number, patch: Partial<ProductVariantInput>) {
    onChange(variants.map((variant, i) => (i === index ? { ...variant, ...patch } : variant)));
  }

  function remove(index: number) {
    onChange(
      variants.filter((_, i) => i !== index).map((variant, i) => ({ ...variant, position: i })),
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p>
        Options someone picks before buying, like a colour. Leave it empty if there is only one
        version.
      </p>

      <ul className="flex flex-col gap-4">
        {variants.map((variant, index) => (
          <li
            key={index}
            className="flex flex-col gap-3 rounded-card border-2 border-ink bg-surface p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <span className={UTILITY_TEXT}>Option {index + 1}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => remove(index)}
                aria-label={`Remove option ${index + 1}`}
              >
                Remove
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Name">
                {(control) => (
                  <Input
                    {...control}
                    value={variant.name}
                    onChange={(event) => update(index, { name: event.target.value })}
                    placeholder="Glow green"
                  />
                )}
              </Field>

              <Field label="Colour" hint="Optional. Shown as a dot next to the name.">
                {(control) => (
                  <Input
                    {...control}
                    type="color"
                    value={variant.swatch_hex ?? "#b8e62e"}
                    onChange={(event) => update(index, { swatch_hex: event.target.value })}
                  />
                )}
              </Field>

              <Field label="Price difference" hint="In cents. 0 means the same price.">
                {(control) => (
                  <Input
                    {...control}
                    type="number"
                    inputMode="numeric"
                    value={String(variant.price_delta_cents)}
                    onChange={(event) =>
                      update(index, { price_delta_cents: Number(event.target.value) || 0 })
                    }
                  />
                )}
              </Field>

              <Field label="Stock" hint="Leave empty if you print it to order.">
                {(control) => (
                  <Input
                    {...control}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={variant.stock_qty === null ? "" : String(variant.stock_qty)}
                    onChange={(event) =>
                      update(index, {
                        stock_qty: event.target.value === "" ? null : Number(event.target.value),
                      })
                    }
                  />
                )}
              </Field>
            </div>
          </li>
        ))}
      </ul>

      <div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => onChange([...variants, blank(variants.length)])}
        >
          Add an option
        </Button>
      </div>
    </div>
  );
}
