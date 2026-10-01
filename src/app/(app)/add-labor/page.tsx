import { getAppData } from "@/lib/data/queries";
import { addLabor } from "@/lib/actions/entries";
import { costCenterOptions } from "@/lib/costCenterOptions";
import { today } from "@/lib/format";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { Field, TextInput, Select, TextArea, SubmitButton } from "@/components/form/Field";

export default async function AddLaborPage() {
  const { cropCycles, costCenters, categories, tags, workers } = await getAppData();
  const costOptions = costCenterOptions(costCenters, cropCycles);
  const expenseCategories = categories.filter((c) => c.kind === "cost");

  return (
    <div>
      <PageHeader title="Add Labor" backHref="/" />
      <Card>
        {workers.length === 0 ? (
          <p className="text-sm text-text-secondary">
            Add a worker first in Settings → Workers before logging labor.
          </p>
        ) : (
          <form action={addLabor} className="flex flex-col gap-4">
            <Field label="Date">
              <TextInput type="date" name="date" defaultValue={today()} required />
            </Field>

            <Field label="Worker">
              <Select name="workerId" required defaultValue="">
                <option value="" disabled>
                  Choose…
                </option>
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="What is this for?">
              <Select name="costCenterId" required defaultValue="">
                <option value="" disabled>
                  Choose…
                </option>
                {costOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Category">
              <Select name="categoryId" required defaultValue="">
                <option value="" disabled>
                  Choose…
                </option>
                {expenseCategories.map((c) => (
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

            <div className="flex gap-3">
              <Field label="Days worked">
                <TextInput type="number" name="daysWorked" min="0.5" step="0.5" inputMode="decimal" defaultValue="1" required />
              </Field>
              <Field label="Daily rate">
                <TextInput type="number" name="dailyRate" min="0" step="0.01" inputMode="decimal" required />
              </Field>
            </div>

            <Field label="Note (optional)">
              <TextArea name="note" />
            </Field>

            <SubmitButton>Save Labor</SubmitButton>
          </form>
        )}
      </Card>
    </div>
  );
}
