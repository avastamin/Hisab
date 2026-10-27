import Link from "next/link";
import { getAppData } from "@/lib/data/queries";
import { cropCycleFinancials, filterByDateRange, householdSpendingByCategory, monthlyCashFlow } from "@/domain/calculations";
import { chartPeriodFromParams, currentMonthRange, dateSpan, formatMoney, monthSpan } from "@/lib/format";
import { Card } from "@/components/Card";
import { StatTile } from "@/components/StatTile";
import { ExpenseRevenueDonut } from "@/components/charts/ExpenseRevenueDonut";
import { MonthlyCashFlowChart } from "@/components/charts/MonthlyCashFlowChart";
import { BudgetProgressBar } from "@/components/BudgetProgressBar";
import { ChartRangeControl } from "@/components/charts/ChartRangeControl";

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const period = chartPeriodFromParams(await searchParams);
  const { cropCycles, costCenters, categories, expenseEntries, laborEntries, saleEntries, budgetSettings } =
    await getAppData();

  const activeCycles = cropCycles.filter((c) => c.status === "planned" || c.status === "growing");

  const monthTotals = householdSpendingByCategory(costCenters, expenseEntries, laborEntries, categories, currentMonthRange());
  const monthSpending = monthTotals.reduce((sum, t) => sum + t.total, 0);

  // Filtered to the exact days first, so a custom range's first and last months only count the days inside it.
  const inPeriod = <T extends { date: string }>(entries: T[]) => filterByDateRange(entries, period);
  const cashFlow = monthlyCashFlow(inPeriod(expenseEntries), inPeriod(laborEntries), inPeriod(saleEntries), period.months);
  const periodTitle =
    period.range === "custom" ? dateSpan(period.start, period.end) : period.range === 1 ? "this month" : `last ${period.range} months`;
  const overallTotals = cashFlow.reduce(
    (acc, m) => ({ totalExpense: acc.totalExpense + m.totalExpense, totalRevenue: acc.totalRevenue + m.totalRevenue }),
    { totalExpense: 0, totalRevenue: 0 },
  );

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold text-text-primary md:hidden">Hisab</h1>

      <div className="flex gap-3">
        <StatTile label="Active crop cycles" value={String(activeCycles.length)} />
        <StatTile label="Household spend (this month)" value={formatMoney(monthSpending)} />
      </div>

      {budgetSettings.enabled ? (
        <Card>
          <h2 className="mb-3 text-base font-semibold text-text-primary">Monthly Budget</h2>
          <BudgetProgressBar spent={monthSpending} budgetAmount={budgetSettings.monthlyAmount} />
        </Card>
      ) : null}

      {/* One range control above both charts, so their numbers always cover the same months. */}
      <ChartRangeControl
        key={`${period.range}-${period.start}-${period.end}`}
        period={period}
        span={period.range === "custom" ? dateSpan(period.start, period.end) : monthSpan(period.months)}
      />

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Card>
          <h2 className="mb-3 text-base font-semibold text-text-primary">Expense vs Revenue ({periodTitle})</h2>
          <ExpenseRevenueDonut totalExpense={overallTotals.totalExpense} totalRevenue={overallTotals.totalRevenue} />
        </Card>

        <Card>
          <h2 className="mb-3 text-base font-semibold text-text-primary">Monthly Cash Flow</h2>
          <MonthlyCashFlowChart key={period.months.join()} data={cashFlow} />
        </Card>
      </div>

      {/* The sidebar has these links from tablet width up. */}
      <Card className="md:hidden">
        <h2 className="mb-3 text-base font-semibold text-text-primary">Quick add</h2>
        <div className="flex flex-col gap-2">
          <Link href="/add-expense" className="rounded-lg bg-primary px-4 py-3 text-center font-semibold text-primary-text">
            Add Expense
          </Link>
          <Link href="/add-labor" className="rounded-lg border border-border bg-surface-alt px-4 py-3 text-center font-semibold text-text-primary">
            Add Labour
          </Link>
          <Link href="/add-sale" className="rounded-lg border border-border bg-surface-alt px-4 py-3 text-center font-semibold text-text-primary">
            Add Sale
          </Link>
          <div className="flex justify-center gap-5 pt-1 text-sm font-medium text-primary">
            <Link href="/entries">See all entries →</Link>
            <Link href="/worker-calendar">Worker calendar →</Link>
          </div>
        </div>
      </Card>

      <div>
        <h2 className="mb-3 text-base font-semibold text-text-primary">Active crop cycles</h2>
        {activeCycles.length === 0 ? (
          <Card>
            <p className="text-sm text-text-secondary">No active crop cycles yet. Start one from the Crops tab.</p>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {activeCycles.map((cycle) => {
              const costCenter = costCenters.find((c) => c.cropCycleId === cycle.id);
              if (!costCenter) return null;
              const financials = cropCycleFinancials(cycle, costCenter, expenseEntries, laborEntries, saleEntries, categories);
              return (
                <Link key={cycle.id} href={`/crop-cycles/${cycle.id}`}>
                  <Card>
                    <p className="font-semibold text-text-primary">{cycle.label}</p>
                    <div className="mt-2 flex justify-between text-sm">
                      <span className="text-text-secondary">Cost</span>
                      <span className="text-text-primary">{formatMoney(financials.totalCost)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">Revenue</span>
                      <span className="text-text-primary">{formatMoney(financials.totalRevenue)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">Profit/Loss</span>
                      <span className={financials.profitLoss >= 0 ? "font-semibold text-positive" : "font-semibold text-negative"}>
                        {formatMoney(financials.profitLoss)}
                      </span>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
