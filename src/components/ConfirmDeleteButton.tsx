"use client";

import { Trash2 } from "lucide-react";
import { showToast } from "@/components/Toaster";
import { PendingButton } from "@/components/form/PendingButton";

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
        if (!window.confirm(message ?? `Delete this ${label}? This can't be undone.`)) {
          e.preventDefault();
          showToast("info", "Nothing was deleted");
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
      {compact ? (
        <PendingButton aria-label={`Delete ${label}`} spinnerSize={18} className="group p-1 text-text-secondary hover:text-negative">
          <Trash2 size={18} className="group-aria-busy:hidden" />
        </PendingButton>
      ) : (
        <PendingButton className="group flex w-full items-center justify-center gap-2 rounded-lg border border-negative px-4 py-3 font-semibold text-negative hover:bg-negative/10">
          <Trash2 size={18} className="group-aria-busy:hidden" />
          Delete {label}
        </PendingButton>
      )}
    </form>
  );
}
