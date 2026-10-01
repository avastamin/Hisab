import { getAppData } from "@/lib/data/queries";
import { updateBudgetSettings } from "@/lib/actions/settings";
import { householdSpendingByCategory } from "@/domain/calculations";
import { currentMonthRange } from "@/lib/format";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { Field, TextInput, SubmitButton } from "@/components/form/Field";
import { BudgetProgressBar } from "@/components/BudgetProgressBar";

export default async function BudgetSettingsPage() {
  const { budgetSettings, costCenters, expenseEntries, laborEntries, categories } = await getAppData();
  const monthTotals = householdSpendingByCategory(costCenters, expenseEntries, laborEntries, categories, currentMonthRange());
  const monthSpending = monthTotals.reduce((sum, t) => sum + t.total, 0);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Monthly Budget" backHref="/settings" />

      <Card>
        <p className="mb-4 text-sm text-text-secondary">
          Optional: set a household spending goal (e.g. ৳50,000/month) and see a progress bar on Home. This only counts
          household spending — farm/crop costs are excluded since they&apos;re seasonal, not a steady monthly target.
        </p>

        <form action={updateBudgetSettings} className="flex flex-col gap-4">
          <label className="flex items-center gap-3">
            <input type="checkbox" name="enabled" defaultChecked={budgetSettings.enabled} className="h-5 w-5 accent-[var(--primary)]" />
            <span className="font-medium text-text-primary">Enable monthly budget</span>
          </label>

          <Field label="Monthly amount (৳)">
            <TextInput
              type="number"
              name="monthlyAmount"
              min="0"
              step="1"
              inputMode="decimal"
              defaultValue={budgetSettings.monthlyAmount || ""}
            />
          </Field>

          <SubmitButton>Save</SubmitButton>
        </form>
      </Card>

      {budgetSettings.enabled ? (
        <Card>
          <h2 className="mb-3 text-base font-semibold text-text-primary">This month so far</h2>
          <BudgetProgressBar spent={monthSpending} budgetAmount={budgetSettings.monthlyAmount} />
        </Card>
      ) : null}
    </div>
  );
}
