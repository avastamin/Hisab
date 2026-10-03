"use client";

import { Trash2 } from "lucide-react";

// Client Component so it can ask for confirmation before the delete action runs. `compact` renders just the bin
// icon, for rows in a settings list.
export function ConfirmDeleteButton({
  action,
  id,
  label,
  message,
  returnTo,
  compact = false,
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
  label: string;
  message?: string;
  returnTo?: string;
  compact?: boolean;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(message ?? `Delete this ${label}? This can't be undone.`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
      {compact ? (
        <button type="submit" aria-label={`Delete ${label}`} className="p-1 text-text-secondary">
          <Trash2 size={18} />
        </button>
      ) : (
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-negative px-4 py-3 font-semibold text-negative"
        >
          <Trash2 size={18} />
          Delete {label}
        </button>
      )}
    </form>
  );
}
