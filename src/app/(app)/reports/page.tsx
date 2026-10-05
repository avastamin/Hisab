import Link from "next/link";
import { getAppData } from "@/lib/data/queries";
import { cropCycleFinancials, filterByDateRange } from "@/domain/calculations";
import { spendingByGroup, spendingByLabel } from "@/domain/categoryGroups";
import { sum } from "@/domain/money";
import { formatMoney, monthFromParam, monthRange } from "@/lib/format";
import { Card } from "@/components/Card";
import { MonthPicker } from "@/components/MonthPicker";

export default async function ReportsPage({ searchParams }: PageProps<"/reports">) {
  const month = monthFromParam((await searchParams).month);
  const { cropCycles, costCenters, categories, tags, expenseEntries, laborEntries, saleEntries } = await getAppData();

  const range = monthRange(month);
  const moneyOut = filterByDateRange([...expenseEntries, ...laborEntries], range);
  const totalOut = sum(moneyOut.map((e) => e.amount));
  const totalIn = sum(filterByDateRange(saleEntries, range).map((e) => e.amount));
  const groups = spendingByGroup(moneyOut, categories);
  const labels = spendingByLabel(moneyOut, tags);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">Reports</h1>
        <Link href={`/entries?month=${month}`} className="text-sm font-medium text-primary">
          All entries →
        </Link>
      </div>

      <MonthPicker month={month} basePath="/reports" />

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <p className="text-xs text-text-secondary">Money out</p>
          <p className="font-semibold text-negative">{formatMoney(totalOut)}</p>
        </Card>
        <Card>
          <p className="text-xs text-text-secondary">Money in</p>
          <p className="font-semibold text-positive">{formatMoney(totalIn)}</p>
        </Card>
      </div>

      <Card>
        <h2 className="mb-3 text-base font-semibold text-text-primary">Spending by category</h2>
        {groups.length === 0 ? (
          <p className="text-sm text-text-secondary">No spending recorded this month.</p>
        ) : (
          <div className="flex flex-col gap-5">
            {groups.map((g) => (
              <div key={g.group}>
                <div className="flex items-baseline justify-between">
                  <p className="font-semibold text-text-primary">{g.label}</p>
                  <p className="text-sm font-semibold text-text-primary">
                    {formatMoney(g.total)}
                    <span className="ml-1 text-xs font-normal text-text-secondary">{share(g.total, totalOut)}</span>
                  </p>
                </div>
                <Bar value={g.total} max={totalOut} strong />
                <div className="mt-2 flex flex-col gap-1.5 pl-3">
                  {g.tags.map((t) => (
                    <div key={t.categoryId}>
                      <div className="flex justify-between text-sm">
                        <span className="text-text-secondary">{t.name}</span>
                        <span className="text-text-primary">{formatMoney(t.total)}</span>
                      </div>
                      <Bar value={t.total} max={g.total} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {labels.length > 0 ? (
        <Card>
          <h2 className="mb-1 text-base font-semibold text-text-primary">Spending by label</h2>
          <p className="mb-3 text-xs text-text-secondary">
            An entry with two labels counts under both, so these don&apos;t add up to the total.
          </p>
          <div className="flex flex-col gap-1">
            {labels.map((l) => (
              <div key={l.tagId} className="flex justify-between text-sm">
                <span className="text-text-secondary">
                  {l.name} <span className="text-xs">· {l.count}</span>
                </span>
                <span className="text-text-primary">{formatMoney(l.total)}</span>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      <Card>
        <h2 className="mb-1 text-base font-semibold text-text-primary">Crop cycles — profit/loss</h2>
        <p className="mb-3 text-xs text-text-secondary">All time, not just this month.</p>
        {cropCycles.length === 0 ? (
          <p className="text-sm text-text-secondary">No crop cycles yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {cropCycles.map((cycle) => {
              const costCenter = costCenters.find((c) => c.cropCycleId === cycle.id);
              if (!costCenter) return null;
              const financials = cropCycleFinancials(cycle, costCenter, expenseEntries, laborEntries, saleEntries, categories);
              return (
                <Link key={cycle.id} href={`/crop-cycles/${cycle.id}`} className="flex justify-between text-sm">
                  <span className="text-text-secondary">{cycle.label}</span>
                  <span className={financials.profitLoss >= 0 ? "font-semibold text-positive" : "font-semibold text-negative"}>
                    {formatMoney(financials.profitLoss)}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

function share(part: number, whole: number): string {
  return whole > 0 ? `${Math.round((part / whole) * 100)}%` : "";
}

function Bar({ value, max, strong = false }: { value: number; max: number; strong?: boolean }) {
  const pct = max > 0 ? Math.max((value / max) * 100, 2) : 0;
  return (
    <div className="mt-1 h-1.5 w-full rounded-full bg-surface-alt" aria-hidden>
      <div className={strong ? "h-full rounded-full bg-primary" : "h-full rounded-full bg-accent"} style={{ width: `${pct}%` }} />
    </div>
  );
}
