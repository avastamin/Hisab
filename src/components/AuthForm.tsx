"use client";

import { useActionState } from "react";
import type { AuthActionState } from "@/lib/actions/auth";

export function AuthForm({
  action,
  submitLabel,
  pendingLabel,
}: {
  action: (state: AuthActionState, formData: FormData) => Promise<AuthActionState>;
  submitLabel: string;
  pendingLabel: string;
}) {
  const [state, formAction, pending] = useActionState<AuthActionState, FormData>(action, { error: null });

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-text-secondary">Email</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          className="rounded-lg border border-border bg-surface px-4 py-3 text-text-primary outline-none focus:border-primary"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-text-secondary">Password</span>
        <input
          type="password"
          name="password"
          required
          minLength={6}
          autoComplete="current-password"
          className="rounded-lg border border-border bg-surface px-4 py-3 text-text-primary outline-none focus:border-primary"
        />
      </label>

      {state.error ? <p className="text-sm text-negative">{state.error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-lg bg-primary px-4 py-3 font-semibold text-primary-text disabled:opacity-60"
      >
        {pending ? pendingLabel : submitLabel}
      </button>
    </form>
  );
}
