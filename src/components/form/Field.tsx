import type { ReactNode } from "react";

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-text-secondary">{label}</span>
      {children}
      {hint ? <span className="text-xs text-text-secondary">{hint}</span> : null}
    </label>
  );
}

const inputClass =
  "rounded-lg border border-border bg-surface px-3 py-2.5 text-text-primary outline-none focus:border-primary";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputClass} ${props.className ?? ""}`} rows={props.rows ?? 3} />;
}

export function SubmitButton({ children }: { children: ReactNode }) {
  return (
    <button type="submit" className="mt-2 rounded-lg bg-primary px-4 py-3 font-semibold text-primary-text">
      {children}
    </button>
  );
}
