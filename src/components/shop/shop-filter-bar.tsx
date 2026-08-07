"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Select } from "@/components/ui";
import { FOCUS_RING } from "@/components/ui/focus-ring";
import { cn } from "@/lib/cn";

export function ShopFilterBar() {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  const sort = params.get("sort") === "price" ? "price" : "newest";
  const inStockOnly = params.get("inStock") === "1";

  function update(next: URLSearchParams) {
    next.delete("page"); // any filter change starts back at page 1
    startTransition(() => router.push(`?${next.toString()}`));
  }

  function onSortChange(value: string) {
    const next = new URLSearchParams(params.toString());
    if (value === "price") next.set("sort", "price");
    else next.delete("sort");
    update(next);
  }

  function onInStockChange(checked: boolean) {
    const next = new URLSearchParams(params.toString());
    if (checked) next.set("inStock", "1");
    else next.delete("inStock");
    update(next);
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <Select
        value={sort}
        onChange={(event) => onSortChange(event.target.value)}
        aria-label="Sort"
        wrapperClassName="w-44"
      >
        <option value="newest">Newest</option>
        <option value="price">Price, low to high</option>
      </Select>

      <label className="flex min-h-11 items-center gap-2">
        <input
          type="checkbox"
          checked={inStockOnly}
          onChange={(event) => onInStockChange(event.target.checked)}
          className={cn("h-5 w-5 accent-flame", FOCUS_RING)}
        />
        <span>In stock only</span>
      </label>
    </div>
  );
}
