import { getAppData } from "@/lib/data/queries";
import { addExpense } from "@/lib/actions/entries";
import { costCenterOptions } from "@/lib/costCenterOptions";
import { safeReturnTo } from "@/lib/returnTo";
import { isoDateParam } from "@/lib/format";
import { CATEGORY_GROUPS } from "@/domain/categoryGroups";
import { otherWorkDays } from "@/lib/workDates";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { ExpenseForm } from "@/components/entries/ExpenseForm";

export default async function AddExpensePage({ searchParams }: PageProps<"/add-expense">) {
  const { costCenterId, date, group, returnTo: returnToParam } = await searchParams;
  const returnTo = safeReturnTo(returnToParam);
  const { cropCycles, costCenters, categories, tags, workers, laborEntries } = await getAppData();

  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader title="Add Expense" backHref={returnTo} />
      <Card>
        <ExpenseForm
          action={addExpense}
          categories={categories.filter((c) => c.kind === "cost")}
          tags={tags}
          costOptions={costCenterOptions(costCenters, cropCycles)}
          workers={workers}
          otherWorkDays={otherWorkDays(laborEntries)}
          defaultCostCenterId={typeof costCenterId === "string" ? costCenterId : undefined}
          defaultDate={isoDateParam(date)}
          defaultGroup={CATEGORY_GROUPS.find((g) => g.id === group)?.id}
          returnTo={returnTo}
          submitLabel="Save Expense"
        />
      </Card>
    </div>
  );
}
