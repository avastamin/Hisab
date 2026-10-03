import { getAppData } from "@/lib/data/queries";
import { cropCycleFinancials, farmSpendingByCategory, householdSpendingByCategory } from "@/domain/calculations";
import { currentMonthRange, formatMoney } from "@/lib/format";
import { Card } from "@/components/Card";

export default async function ReportsPage() {
  const { cropCycles, costCenters, categories, expenseEntries, laborEntries, saleEntries } = await getAppData();

  const householdTotals = householdSpendingByCategory(costCenters, expenseEntries, laborEntries, categories, currentMonthRange());
  const farmTotals = farmSpendingByCategory(costCenters, expenseEntries, laborEntries, categories, currentMonthRange());

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-text-primary">Reports</h1>

      <Card>
        <h2 className="mb-3 text-base font-semibold text-text-primary">Household spend by category (this month)</h2>
        {householdTotals.length === 0 ? (
          <p className="text-sm text-text-secondary">No household spending recorded this month.</p>
        ) : (
          <div className="flex flex-col gap-1">
            {householdTotals.map((t) => (
              <div key={t.categoryId} className="flex justify-between text-sm">
                <span className="text-text-secondary">{t.categoryName}</span>
                <span className="text-text-primary">{formatMoney(t.total)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h2 className="mb-3 text-base font-semibold text-text-primary">Farm spend by category (general, this month)</h2>
        <p className="mb-3 text-xs text-text-secondary">
          Agro spending not tied to a specific crop cycle — e.g. bulk fertilizer bought before it&apos;s allocated. Spending
          booked to a crop cycle itself shows under that cycle below.
        </p>
        {farmTotals.length === 0 ? (
          <p className="text-sm text-text-secondary">No general farm spending recorded this month.</p>
        ) : (
          <div className="flex flex-col gap-1">
            {farmTotals.map((t) => (
              <div key={t.categoryId} className="flex justify-between text-sm">
                <span className="text-text-secondary">{t.categoryName}</span>
                <span className="text-text-primary">{formatMoney(t.total)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h2 className="mb-3 text-base font-semibold text-text-primary">Crop cycles — profit/loss</h2>
        {cropCycles.length === 0 ? (
          <p className="text-sm text-text-secondary">No crop cycles yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {cropCycles.map((cycle) => {
              const costCenter = costCenters.find((c) => c.cropCycleId === cycle.id);
              if (!costCenter) return null;
              const financials = cropCycleFinancials(cycle, costCenter, expenseEntries, laborEntries, saleEntries, categories);
              return (
                <div key={cycle.id} className="flex justify-between text-sm">
                  <span className="text-text-secondary">{cycle.label}</span>
                  <span className={financials.profitLoss >= 0 ? "font-semibold text-positive" : "font-semibold text-negative"}>
                    {formatMoney(financials.profitLoss)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
