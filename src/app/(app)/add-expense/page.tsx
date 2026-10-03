import { getAppData } from "@/lib/data/queries";
import { addExpense } from "@/lib/actions/entries";
import { costCenterOptions } from "@/lib/costCenterOptions";
import { safeReturnTo } from "@/lib/returnTo";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { ExpenseForm } from "@/components/entries/ExpenseForm";

export default async function AddExpensePage({ searchParams }: PageProps<"/add-expense">) {
  const { costCenterId, returnTo: returnToParam } = await searchParams;
  const returnTo = safeReturnTo(returnToParam);
  const { cropCycles, costCenters, categories, tags, workers } = await getAppData();

  return (
    <div>
      <PageHeader title="Add Expense" backHref={returnTo} />
      <Card>
        <ExpenseForm
          action={addExpense}
          categories={categories.filter((c) => c.kind === "cost")}
          tags={tags}
          costOptions={costCenterOptions(costCenters, cropCycles)}
          workers={workers}
          defaultCostCenterId={typeof costCenterId === "string" ? costCenterId : undefined}
          returnTo={returnTo}
          submitLabel="Save Expense"
        />
      </Card>
    </div>
  );
}
