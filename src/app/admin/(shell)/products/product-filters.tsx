"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Input, Select } from "@/components/ui";

/**
 * Search and status filter, kept in the URL so a reload or a shared link lands
 * on the same list. Typing is debounced, because he is on a phone on mobile data.
 */
export function ProductFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  const [term, setTerm] = useState(params.get("q") ?? "");
  const status = params.get("status") ?? "";

  useEffect(() => {
    const current = params.get("q") ?? "";
    if (term === current) return;

    const timer = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (term.trim()) next.set("q", term.trim());
      else next.delete("q");
      startTransition(() => router.replace(`/admin/products?${next}`));
    }, 300);

    return () => clearTimeout(timer);
  }, [term, params, router]);

  function onStatusChange(value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set("status", value);
    else next.delete("status");
    startTransition(() => router.replace(`/admin/products?${next}`));
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Input
        type="search"
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        placeholder="Search by name"
        aria-label="Search prints by name"
        className="sm:flex-1"
      />
      <Select
        value={status}
        onChange={(event) => onStatusChange(event.target.value)}
        aria-label="Filter by status"
        wrapperClassName="sm:w-56"
      >
        <option value="">All statuses</option>
        <option value="active">On the shelf</option>
        <option value="draft">Draft</option>
        <option value="archived">Archived</option>
      </Select>
    </div>
  );
}
