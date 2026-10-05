import { getAppData } from "@/lib/data/queries";
import { formatMoney, monthFromParam } from "@/lib/format";
import { MonthPicker } from "@/components/MonthPicker";
import { sum } from "@/domain/money";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { EntryList, buildEntryItems } from "@/components/entries/EntryList";

// Every expense, labour entry and sale for one month, so entries outside crop cycles (household, farm, vehicles…)
// can be found and edited too.
export default async function EntriesPage({ searchParams }: PageProps<"/entries">) {
  const { month: monthParam } = await searchParams;
  const month = monthFromParam(monthParam);
  const { expenseEntries, laborEntries, saleEntries, categories, workers, costCenters, cropCycles } = await getAppData();

  const inMonth = <T extends { date: string }>(entries: T[]) => entries.filter((e) => e.date.startsWith(month));
  const expenses = inMonth(expenseEntries);
  const labour = inMonth(laborEntries);
  const sales = inMonth(saleEntries);
  const moneyOut = sum([...expenses, ...labour].map((e) => e.amount));
  const moneyIn = sum(sales.map((e) => e.amount));

  const entries = buildEntryItems({
    expenseEntries: expenses,
    laborEntries: labour,
    saleEntries: sales,
    categories,
    workers,
    costCenters,
    cropCycles,
    returnTo: `/entries?month=${month}`,
    showWhere: true,
  });

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="All Entries" backHref="/" />

      <MonthPicker month={month} basePath="/entries" />

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <p className="text-xs text-text-secondary">Money out</p>
          <p className="font-semibold text-negative">{formatMoney(moneyOut)}</p>
        </Card>
        <Card>
          <p className="text-xs text-text-secondary">Money in</p>
          <p className="font-semibold text-positive">{formatMoney(moneyIn)}</p>
        </Card>
      </div>

      <Card>
        <EntryList entries={entries} emptyText="Nothing recorded this month." />
      </Card>
    </div>
  );
}
