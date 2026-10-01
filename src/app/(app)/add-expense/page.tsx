import { getAppData } from "@/lib/data/queries";
import { addExpense } from "@/lib/actions/entries";
import { costCenterOptions } from "@/lib/costCenterOptions";
import { today } from "@/lib/format";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { Field, TextInput, Select, TextArea, SubmitButton } from "@/components/form/Field";

export default async function AddExpensePage() {
  const { cropCycles, costCenters, categories, tags } = await getAppData();
  const costOptions = costCenterOptions(costCenters, cropCycles);
  const expenseCategories = categories.filter((c) => c.kind === "cost");

  return (
    <div>
      <PageHeader title="Add Expense" backHref="/" />
      <Card>
        <form action={addExpense} className="flex flex-col gap-4">
          <Field label="Date">
            <TextInput type="date" name="date" defaultValue={today()} required />
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

          <Field label="Amount">
            <TextInput type="number" name="amount" min="0.01" step="0.01" inputMode="decimal" placeholder="0.00" required />
          </Field>

          <Field label="Note (optional)">
            <TextArea name="note" />
          </Field>

          <SubmitButton>Save Expense</SubmitButton>
        </form>
      </Card>
    </div>
  );
}
