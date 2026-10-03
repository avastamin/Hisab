import Link from "next/link";
import { getAppData } from "@/lib/data/queries";
import { cropCycleFinancials, householdSpendingByCategory, monthlyCashFlow } from "@/domain/calculations";
import { currentMonthRange } from "@/lib/format";
import { formatMoney } from "@/lib/format";
import { Card } from "@/components/Card";
import { StatTile } from "@/components/StatTile";
import { ExpenseRevenueDonut } from "@/components/charts/ExpenseRevenueDonut";
import { MonthlyCashFlowChart } from "@/components/charts/MonthlyCashFlowChart";
import { BudgetProgressBar } from "@/components/BudgetProgressBar";

function lastMonths(count: number): string[] {
  const now = new Date();
  const months: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return months;
}

export default async function HomePage() {
  const { cropCycles, costCenters, categories, expenseEntries, laborEntries, saleEntries, budgetSettings } =
    await getAppData();

  const activeCycles = cropCycles.filter((c) => c.status === "planned" || c.status === "growing");

  const monthTotals = householdSpendingByCategory(costCenters, expenseEntries, laborEntries, categories, currentMonthRange());
  const monthSpending = monthTotals.reduce((sum, t) => sum + t.total, 0);

  const months = lastMonths(6);
  const cashFlow = monthlyCashFlow(expenseEntries, laborEntries, saleEntries, months);
  const overallTotals = cashFlow.reduce(
    (acc, m) => ({ totalExpense: acc.totalExpense + m.totalExpense, totalRevenue: acc.totalRevenue + m.totalRevenue }),
    { totalExpense: 0, totalRevenue: 0 },
  );

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold text-text-primary">Hisab</h1>

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

      <Card>
        <h2 className="mb-3 text-base font-semibold text-text-primary">Expense vs Revenue (last 6 months)</h2>
        <ExpenseRevenueDonut totalExpense={overallTotals.totalExpense} totalRevenue={overallTotals.totalRevenue} />
      </Card>

      <Card>
        <h2 className="mb-3 text-base font-semibold text-text-primary">Monthly Cash Flow</h2>
        <MonthlyCashFlowChart data={cashFlow} />
      </Card>

      <Card>
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
          <Link href="/entries" className="pt-1 text-center text-sm font-medium text-primary">
            See all entries →
          </Link>
        </div>
      </Card>

      <div>
        <h2 className="mb-3 text-base font-semibold text-text-primary">Active crop cycles</h2>
        {activeCycles.length === 0 ? (
          <Card>
            <p className="text-sm text-text-secondary">No active crop cycles yet. Start one from the Crops tab.</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
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
