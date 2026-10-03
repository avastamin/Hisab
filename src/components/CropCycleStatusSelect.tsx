"use client";

import { updateCropCycleStatus } from "@/lib/actions/entries";

const STATUSES = ["planned", "growing", "harvested", "closed"] as const;

// Client Component so the select can submit its form on change; the page itself is a Server Component.
export function CropCycleStatusSelect({ id, status }: { id: string; status: string }) {
  return (
    <form action={updateCropCycleStatus} className="mt-3 flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <span className="text-sm font-medium text-text-secondary">Status</span>
      <select
        name="status"
        defaultValue={status}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="rounded-lg border border-border bg-surface px-2 py-1.5 text-sm text-text-primary"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s[0].toUpperCase() + s.slice(1)}
          </option>
        ))}
      </select>
    </form>
  );
}
