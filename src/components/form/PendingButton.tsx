"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import clsx from "clsx";

/**
 * A submit button that shows a spinner and disables itself while its form's action runs, so the person can see the
 * server is working and can't submit twice. Must sit inside the <form>. With `name` / `value` (several buttons in
 * one form), only the button that was pressed spins.
 */
export function PendingButton({
  children,
  className,
  spinnerSize = 16,
  pending: pendingProp,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children?: ReactNode; spinnerSize?: number; pending?: boolean }) {
  const status = useFormStatus();
  const pressed = props.name === undefined || status.data?.get(String(props.name)) === String(props.value);
  const pending = pendingProp ?? (status.pending && pressed);

  return (
    <button
      type="submit"
      {...props}
      disabled={props.disabled || status.pending || pendingProp}
      aria-busy={pending || undefined}
      className={clsx("inline-flex items-center justify-center gap-2 disabled:cursor-wait", className)}
    >
      {pending ? <Loader2 size={spinnerSize} className="shrink-0 animate-spin" aria-hidden /> : null}
      {children}
    </button>
  );
}

/** A small spinner shown while the surrounding form's action runs, for forms submitted without a button. */
export function FormPendingSpinner() {
  const { pending } = useFormStatus();
  return pending ? <Loader2 size={16} className="animate-spin text-text-secondary" aria-label="Saving" /> : null;
}
