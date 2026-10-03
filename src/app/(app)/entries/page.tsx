import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getAppData } from "@/lib/data/queries";
import { formatMoney, today } from "@/lib/format";
import { sum } from "@/domain/money";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { EntryList, buildEntryItems } from "@/components/entries/EntryList";

/** "2026-10" shifted by `delta` months. */
function shiftMonth(month: string, delta: number): string {
  const [year, m] = month.split("-").map(Number);
  const d = new Date(year, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthTitle(month: string): string {
  const [year, m] = month.split("-").map(Number);
  return new Date(year, m - 1, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

// Every expense, labour entry and sale for one month, so entries outside crop cycles (household, farm, vehicles…)
// can be found and edited too.
export default async function EntriesPage({ searchParams }: PageProps<"/entries">) {
  const { month: monthParam } = await searchParams;
  const month = typeof monthParam === "string" && /^\d{4}-\d{2}$/.test(monthParam) ? monthParam : today().slice(0, 7);
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

      <div className="flex items-center justify-between">
        <Link href={`/entries?month=${shiftMonth(month, -1)}`} aria-label="Previous month" className="rounded-full p-2 text-text-secondary">
          <ChevronLeft size={20} />
        </Link>
        <p className="font-semibold text-text-primary">{monthTitle(month)}</p>
        <Link href={`/entries?month=${shiftMonth(month, 1)}`} aria-label="Next month" className="rounded-full p-2 text-text-secondary">
          <ChevronRight size={20} />
        </Link>
      </div>

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
