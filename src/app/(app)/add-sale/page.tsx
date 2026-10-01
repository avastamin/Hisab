import { getAppData } from "@/lib/data/queries";
import { addSale } from "@/lib/actions/entries";
import { UNIT_OPTIONS } from "@/lib/unitOptions";
import { today } from "@/lib/format";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { Field, TextInput, Select, TextArea, SubmitButton } from "@/components/form/Field";

export default async function AddSalePage() {
  const { cropCycles, categories, tags } = await getAppData();
  const revenueCategories = categories.filter((c) => c.kind === "revenue");

  return (
    <div>
      <PageHeader title="Add Sale" backHref="/" />
      <Card>
        {cropCycles.length === 0 ? (
          <p className="text-sm text-text-secondary">Start a crop cycle first in the Crops tab before logging a sale.</p>
        ) : (
          <form action={addSale} className="flex flex-col gap-4">
            <Field label="Date">
              <TextInput type="date" name="date" defaultValue={today()} required />
            </Field>

            <Field label="Crop cycle">
              <Select name="cropCycleId" required defaultValue="">
                <option value="" disabled>
                  Choose…
                </option>
                {cropCycles.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Category">
              <Select name="categoryId" required defaultValue="">
                <option value="" disabled>
                  Choose…
                </option>
                {revenueCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>

            {tags.length > 0 ? (
              <Field label="Tags (optional)">
                <div className="flex flex-wrap gap-2">
                  {tags.map((t) => (
                    <label
                      key={t.id}
                      className="flex items-center gap-1.5 rounded-full border border-border bg-surface-alt px-3 py-1.5 text-sm text-text-primary"
                    >
                      <input type="checkbox" name="tagIds" value={t.id} className="accent-[var(--primary)]" />
                      {t.name}
                    </label>
                  ))}
                </div>
              </Field>
            ) : null}

            <Field label="Buyer (optional)">
              <TextInput type="text" name="buyer" />
            </Field>

            <div className="flex gap-3">
              <Field label="Quantity">
                <TextInput type="number" name="quantity" min="0.01" step="0.01" inputMode="decimal" required />
              </Field>
              <Field label="Unit">
                <Select name="unit" required defaultValue="kg">
                  {UNIT_OPTIONS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <Field label="Unit price">
              <TextInput type="number" name="unitPrice" min="0" step="0.01" inputMode="decimal" required />
            </Field>

            <Field label="Note (optional)">
              <TextArea name="note" />
            </Field>

            <SubmitButton>Save Sale</SubmitButton>
          </form>
        )}
      </Card>
    </div>
  );
}
