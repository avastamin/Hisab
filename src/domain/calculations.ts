import type {
  Category,
  CostCenter,
  ExpenseEntry,
  ISODateString,
  LaborEntry,
  MoneyEntry,
  SaleEntry,
  CropCycle,
} from "./types";
import { round2, sum } from "./money";

export interface DateRange {
  /** Inclusive. Omit for open-ended. */
  start?: ISODateString;
  /** Inclusive. Omit for open-ended. */
  end?: ISODateString;
}

export function isWithinRange(date: ISODateString, range?: DateRange): boolean {
  if (!range) return true;
  if (range.start && date < range.start) return false;
  if (range.end && date > range.end) return false;
  return true;
}

export function filterByDateRange<T extends { date: ISODateString }>(
  entries: readonly T[],
  range?: DateRange,
): T[] {
  return entries.filter((entry) => isWithinRange(entry.date, range));
}

/** Combines expense + labor entries into one list of "money out" for a cost center, since a labor entry is a specialized expense. */
export function moneyEntriesForCostCenter(
  costCenterId: string,
  expenseEntries: readonly ExpenseEntry[],
  laborEntries: readonly LaborEntry[],
): MoneyEntry[] {
  return [
    ...expenseEntries.filter((e) => e.costCenterId === costCenterId),
    ...laborEntries.filter((e) => e.costCenterId === costCenterId),
  ];
}

export interface CategoryTotal {
  categoryId: string;
  categoryName: string;
  total: number;
}

/** Groups a set of money entries by category, sorted highest total first. Categories with no entries are omitted. */
export function totalsByCategory(
  entries: readonly MoneyEntry[],
  categories: readonly Category[],
): CategoryTotal[] {
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const totals = new Map<string, number>();
  for (const entry of entries) {
    totals.set(entry.categoryId, round2((totals.get(entry.categoryId) ?? 0) + entry.amount));
  }
  return [...totals.entries()]
    .map(([categoryId, total]) => ({
      categoryId,
      categoryName: categoryById.get(categoryId)?.name ?? "Uncategorized",
      total,
    }))
    .sort((a, b) => b.total - a.total);
}

export interface CropCycleFinancials {
  cropCycleId: string;
  totalCost: number;
  totalRevenue: number;
  profitLoss: number;
  costByCategory: CategoryTotal[];
  totalQuantitySold: number;
  /** null when the cycle has no expectedYield set, or units disagree. */
  remainingStock: number | null;
  /** null when nothing has been sold yet. */
  costPerUnitSold: number | null;
}

/**
 * The core "what did this crop cycle cost, and did it make money" rollup.
 * costCenterId must be the CostCenter whose type is "crop_cycle" and whose
 * cropCycleId matches — entries are always attached to a cost center, never
 * directly to a crop cycle.
 */
export function cropCycleFinancials(
  cropCycle: CropCycle,
  costCenter: CostCenter,
  expenseEntries: readonly ExpenseEntry[],
  laborEntries: readonly LaborEntry[],
  saleEntries: readonly SaleEntry[],
  categories: readonly Category[],
  range?: DateRange,
): CropCycleFinancials {
  const moneyEntries = filterByDateRange(
    moneyEntriesForCostCenter(costCenter.id, expenseEntries, laborEntries),
    range,
  );
  const sales = filterByDateRange(
    saleEntries.filter((s) => s.cropCycleId === cropCycle.id),
    range,
  );

  const totalCost = sum(moneyEntries.map((e) => e.amount));
  const totalRevenue = sum(sales.map((s) => s.amount));
  const totalQuantitySold = sum(sales.map((s) => s.quantity));

  const soldInYieldUnit = sales.filter((s) => s.unit === cropCycle.yieldUnit);
  const quantitySoldInYieldUnit = sum(soldInYieldUnit.map((s) => s.quantity));
  const remainingStock =
    cropCycle.expectedYield !== undefined
      ? round2(cropCycle.expectedYield - quantitySoldInYieldUnit)
      : null;

  return {
    cropCycleId: cropCycle.id,
    totalCost,
    totalRevenue,
    profitLoss: round2(totalRevenue - totalCost),
    costByCategory: totalsByCategory(moneyEntries, categories),
    totalQuantitySold,
    remainingStock,
    costPerUnitSold: totalQuantitySold > 0 ? round2(totalCost / totalQuantitySold) : null,
  };
}

/** Narrows to the entries booked against cost centers of the given type(s), within an optional date range. */
function entriesForCostCenterTypes(
  types: readonly CostCenter["type"][],
  costCenters: readonly CostCenter[],
  expenseEntries: readonly ExpenseEntry[],
  laborEntries: readonly LaborEntry[],
  range?: DateRange,
): MoneyEntry[] {
  const matchingIds = new Set(costCenters.filter((c) => types.includes(c.type)).map((c) => c.id));
  return filterByDateRange(
    [...expenseEntries, ...laborEntries].filter((e) => matchingIds.has(e.costCenterId)),
    range,
  );
}

/** Household spending: "general", "vehicle", and "person" cost centers — excludes crop cycles and general farm spend. */
export function householdSpendingByCategory(
  costCenters: readonly CostCenter[],
  expenseEntries: readonly ExpenseEntry[],
  laborEntries: readonly LaborEntry[],
  categories: readonly Category[],
  range?: DateRange,
): CategoryTotal[] {
  const entries = entriesForCostCenterTypes(
    ["general", "vehicle", "person"],
    costCenters,
    expenseEntries,
    laborEntries,
    range,
  );
  return totalsByCategory(entries, categories);
}

/** General farm/agro spending not yet tied to a specific crop cycle (e.g. bulk fertilizer) — "farm" cost centers only. */
export function farmSpendingByCategory(
  costCenters: readonly CostCenter[],
  expenseEntries: readonly ExpenseEntry[],
  laborEntries: readonly LaborEntry[],
  categories: readonly Category[],
  range?: DateRange,
): CategoryTotal[] {
  const entries = entriesForCostCenterTypes(["farm"], costCenters, expenseEntries, laborEntries, range);
  return totalsByCategory(entries, categories);
}

export interface ExpenseVsRevenueTotals {
  totalExpense: number;
  totalRevenue: number;
}

/** Overall "money out" (expense + labor, every cost center) vs "money in" (sales), for a pie/donut chart. */
export function expenseVsRevenueTotals(
  expenseEntries: readonly ExpenseEntry[],
  laborEntries: readonly LaborEntry[],
  saleEntries: readonly SaleEntry[],
  range?: DateRange,
): ExpenseVsRevenueTotals {
  const expenses = filterByDateRange([...expenseEntries, ...laborEntries], range);
  const sales = filterByDateRange(saleEntries, range);
  return {
    totalExpense: sum(expenses.map((e) => e.amount)),
    totalRevenue: sum(sales.map((s) => s.amount)),
  };
}

export interface MonthlyCashFlow {
  /** "YYYY-MM", as supplied by the caller. */
  month: string;
  totalExpense: number;
  totalRevenue: number;
}

/**
 * Buckets expense+labor cost ("money out") and sale revenue ("money in") into the given
 * YYYY-MM months, across every cost center (crop cycles and household alike) — the
 * Home screen's monthly cash-flow chart. `months` is supplied by the caller (rather than
 * computed from "today" in here) so this stays a pure, easily-testable function; a month
 * with no entries still appears in the result with zeros.
 */
export function monthlyCashFlow(
  expenseEntries: readonly ExpenseEntry[],
  laborEntries: readonly LaborEntry[],
  saleEntries: readonly SaleEntry[],
  months: readonly string[],
): MonthlyCashFlow[] {
  const monthOf = (date: ISODateString): string => date.slice(0, 7);

  const expenseByMonth = new Map<string, number>();
  for (const entry of [...expenseEntries, ...laborEntries]) {
    const month = monthOf(entry.date);
    expenseByMonth.set(month, round2((expenseByMonth.get(month) ?? 0) + entry.amount));
  }

  const revenueByMonth = new Map<string, number>();
  for (const sale of saleEntries) {
    const month = monthOf(sale.date);
    revenueByMonth.set(month, round2((revenueByMonth.get(month) ?? 0) + sale.amount));
  }

  return months.map((month) => ({
    month,
    totalExpense: expenseByMonth.get(month) ?? 0,
    totalRevenue: revenueByMonth.get(month) ?? 0,
  }));
}

export interface BudgetProgress {
  spent: number;
  budgetAmount: number;
  /** budgetAmount - spent; negative once over budget. */
  remaining: number;
  /** spent / budgetAmount * 100, uncapped (e.g. 142 when 42% over) — the caller decides how to clamp a bar's width. 0 when budgetAmount is 0. */
  percentUsed: number;
  status: "under" | "approaching" | "over";
}

/** Progress of spending against a monthly budget goal — pure math, used by the optional Home budget bar. */
export function budgetProgress(spent: number, budgetAmount: number): BudgetProgress {
  const percentUsed = budgetAmount > 0 ? round2((spent / budgetAmount) * 100) : 0;
  const status: BudgetProgress["status"] = percentUsed >= 100 ? "over" : percentUsed >= 80 ? "approaching" : "under";
  return {
    spent,
    budgetAmount,
    remaining: round2(budgetAmount - spent),
    percentUsed,
    status,
  };
}

export interface WorkerTotal {
  workerId: string;
  totalPaid: number;
  totalDays: number;
  entryCount: number;
}

export function workerTotals(
  workerId: string,
  laborEntries: readonly LaborEntry[],
  range?: DateRange,
): WorkerTotal {
  const entries = filterByDateRange(
    laborEntries.filter((e) => e.workerId === workerId),
    range,
  );
  return {
    workerId,
    totalPaid: sum(entries.map((e) => e.amount)),
    totalDays: sum(entries.map((e) => e.daysWorked)),
    entryCount: entries.length,
  };
}
