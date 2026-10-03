import type { Category, Tag } from "@/domain/types";
import { Field, Select } from "@/components/form/Field";

// Building blocks shared by the entry forms (Add and Edit pages). No hooks here, so they work in both the
// Server Component forms and the client-side ExpenseForm.

export type FormAction = (formData: FormData) => Promise<void>;

export interface CommonProps {
  action: FormAction;
  categories: Category[];
  tags: Tag[];
  submitLabel: string;
  returnTo?: string;
}

export function HiddenFields({ id, returnTo }: { id?: string; returnTo?: string }) {
  return (
    <>
      {id ? <input type="hidden" name="id" value={id} /> : null}
      {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
    </>
  );
}

export function ChooseSelect({
  name,
  defaultValue,
  options,
  onChange,
}: {
  name: string;
  defaultValue?: string;
  options: { id: string; label: string }[];
  onChange?: (value: string) => void;
}) {
  return (
    <Select name={name} required defaultValue={defaultValue ?? ""} onChange={onChange ? (e) => onChange(e.target.value) : undefined}>
      <option value="" disabled>
        Choose…
      </option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.label}
        </option>
      ))}
    </Select>
  );
}

export function TagPicker({ tags, selected = [] }: { tags: Tag[]; selected?: string[] }) {
  if (tags.length === 0) return null;
  return (
    <Field label="Tags (optional)">
      <div className="flex flex-wrap gap-2">
        {tags.map((t) => (
          <label
            key={t.id}
            className="flex items-center gap-1.5 rounded-full border border-border bg-surface-alt px-3 py-1.5 text-sm text-text-primary"
          >
            <input
              type="checkbox"
              name="tagIds"
              value={t.id}
              defaultChecked={selected.includes(t.id)}
              className="accent-[var(--primary)]"
            />
            {t.name}
          </label>
        ))}
      </div>
    </Field>
  );
}

export const categoryOptions = (categories: Category[]) => categories.map((c) => ({ id: c.id, label: c.name }));
