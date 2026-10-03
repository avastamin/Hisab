import { notFound } from "next/navigation";
import { getAppData } from "@/lib/data/queries";
import { updateExpense, deleteExpense } from "@/lib/actions/entries";
import { costCenterOptions } from "@/lib/costCenterOptions";
import { safeReturnTo } from "@/lib/returnTo";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { ExpenseForm } from "@/components/entries/ExpenseForm";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";

export default async function EditExpensePage({ params, searchParams }: PageProps<"/expenses/[id]/edit">) {
  const { id } = await params;
  const returnTo = safeReturnTo((await searchParams).returnTo);
  const { cropCycles, costCenters, categories, tags, workers, expenseEntries } = await getAppData();

  const entry = expenseEntries.find((e) => e.id === id);
  if (!entry) notFound();

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Edit Expense" backHref={returnTo} />
      <Card>
        <ExpenseForm
          action={updateExpense}
          categories={categories.filter((c) => c.kind === "cost")}
          tags={tags}
          costOptions={costCenterOptions(costCenters, cropCycles)}
          workers={workers}
          entry={entry}
          returnTo={returnTo}
          submitLabel="Save Changes"
        />
      </Card>
      <ConfirmDeleteButton action={deleteExpense} id={entry.id} returnTo={returnTo} label="expense" />
    </div>
  );
}
