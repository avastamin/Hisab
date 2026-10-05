import {
  budgetProgress,
  cropCycleFinancials,
  expenseVsRevenueTotals,
  householdSpendingByCategory,
  monthlyCashFlow,
  totalsByCategory,
  workerTotals,
  filterByDateRange,
} from "../calculations";
import type {
  Category,
  CostCenter,
  CropCycle,
  ExpenseEntry,
  LaborEntry,
  SaleEntry,
} from "../types";

const fertilizer: Category = {
  id: "cat-fertilizer",
  name: "Fertilizer",
  kind: "cost",
  isBuiltIn: true,
  createdAt: "2026-01-01T00:00:00.000Z",
};
const labor: Category = {
  id: "cat-labor",
  name: "Labour",
  kind: "cost",
  isBuiltIn: true,
  createdAt: "2026-01-01T00:00:00.000Z",
};
const produceSale: Category = {
  id: "cat-produce-sale",
  name: "Produce Sale",
  kind: "revenue",
  isBuiltIn: true,
  createdAt: "2026-01-01T00:00:00.000Z",
};
const groceries: Category = {
  id: "cat-groceries",
  name: "Groceries",
  kind: "cost",
  isBuiltIn: true,
  createdAt: "2026-01-01T00:00:00.000Z",
};
const fuel: Category = {
  id: "cat-fuel",
  name: "Fuel",
  kind: "cost",
  isBuiltIn: true,
  createdAt: "2026-01-01T00:00:00.000Z",
};
const categories = [fertilizer, labor, produceSale, groceries, fuel];

const tomatoCycle: CropCycle = {
  id: "cycle-tomato-2026",
  cropId: "crop-tomato",
  label: "Tomato — Winter 2026",
  status: "growing",
  startDate: "2026-02-01",
  plannedHarvestDate: "2026-05-01",
  expectedYield: 500,
  yieldUnit: "kg",
  createdAt: "2026-02-01T00:00:00.000Z",
};

const tomatoCostCenter: CostCenter = {
  id: "cc-tomato-2026",
  type: "crop_cycle",
  cropCycleId: tomatoCycle.id,
  name: tomatoCycle.label,
  createdAt: "2026-02-01T00:00:00.000Z",
};

const bikeCostCenter: CostCenter = {
  id: "cc-bike",
  type: "vehicle",
  name: "Honda 125",
  createdAt: "2026-01-01T00:00:00.000Z",
};

const generalCostCenter: CostCenter = {
  id: "cc-general",
  type: "general",
  name: "General household",
  createdAt: "2026-01-01T00:00:00.000Z",
};

const farmCostCenter: CostCenter = {
  id: "cc-farm",
  type: "farm",
  name: "General farm",
  createdAt: "2026-01-01T00:00:00.000Z",
};

function expense(partial: Partial<ExpenseEntry> & Pick<ExpenseEntry, "id" | "date" | "costCenterId" | "categoryId" | "amount">): ExpenseEntry {
  return {
    kind: "expense",
    tagIds: [],
    createdAt: `${partial.date}T00:00:00.000Z`,
    ...partial,
  };
}

function laborEntry(
  partial: Partial<LaborEntry> &
    Pick<LaborEntry, "id" | "date" | "costCenterId" | "workerId" | "daysWorked" | "dailyRate" | "amount">,
): LaborEntry {
  return {
    kind: "labor",
    categoryId: labor.id,
    tagIds: [],
    createdAt: `${partial.date}T00:00:00.000Z`,
    ...partial,
  };
}

function sale(
  partial: Partial<SaleEntry> & Pick<SaleEntry, "id" | "date" | "cropCycleId" | "quantity" | "unit" | "unitPrice" | "amount">,
): SaleEntry {
  return {
    categoryId: produceSale.id,
    tagIds: [],
    createdAt: `${partial.date}T00:00:00.000Z`,
    ...partial,
  };
}

describe("totalsByCategory", () => {
  it("groups and sums entries by category, highest first", () => {
    const entries = [
      expense({ id: "e1", date: "2026-03-01", costCenterId: tomatoCostCenter.id, categoryId: fertilizer.id, amount: 1200 }),
      expense({ id: "e2", date: "2026-03-05", costCenterId: tomatoCostCenter.id, categoryId: fertilizer.id, amount: 300 }),
      laborEntry({ id: "l1", date: "2026-03-02", costCenterId: tomatoCostCenter.id, workerId: "w1", daysWorked: 2, dailyRate: 500, amount: 1000 }),
    ];
    const result = totalsByCategory(entries, categories);
    expect(result).toEqual([
      { categoryId: fertilizer.id, categoryName: "Fertilizer", total: 1500 },
      { categoryId: labor.id, categoryName: "Labour", total: 1000 },
    ]);
  });

  it("labels an unknown category id rather than throwing", () => {
    const entries = [expense({ id: "e1", date: "2026-03-01", costCenterId: "x", categoryId: "missing", amount: 100 })];
    expect(totalsByCategory(entries, categories)[0]?.categoryName).toBe("Uncategorized");
  });
});

describe("cropCycleFinancials", () => {
  const expenseEntries = [
    expense({ id: "e1", date: "2026-03-01", costCenterId: tomatoCostCenter.id, categoryId: fertilizer.id, amount: 1200 }),
  ];
  const laborEntries = [
    laborEntry({ id: "l1", date: "2026-03-02", costCenterId: tomatoCostCenter.id, workerId: "w1", daysWorked: 4, dailyRate: 500, amount: 2000 }),
  ];
  const saleEntries = [
    sale({ id: "s1", date: "2026-05-10", cropCycleId: tomatoCycle.id, quantity: 200, unit: "kg", unitPrice: 40, amount: 8000 }),
    sale({ id: "s2", date: "2026-05-20", cropCycleId: tomatoCycle.id, quantity: 100, unit: "kg", unitPrice: 42, amount: 4200 }),
  ];

  it("computes total cost, revenue, and profit/loss", () => {
    const result = cropCycleFinancials(
      tomatoCycle,
      tomatoCostCenter,
      expenseEntries,
      laborEntries,
      saleEntries,
      categories,
    );
    expect(result.totalCost).toBe(3200);
    expect(result.totalRevenue).toBe(12200);
    expect(result.profitLoss).toBe(9000);
  });

  it("computes cost per unit sold", () => {
    const result = cropCycleFinancials(tomatoCycle, tomatoCostCenter, expenseEntries, laborEntries, saleEntries, categories);
    // 3200 total cost / 300 kg sold
    expect(result.costPerUnitSold).toBe(10.67);
  });

  it("computes remaining stock against expectedYield", () => {
    const result = cropCycleFinancials(tomatoCycle, tomatoCostCenter, expenseEntries, laborEntries, saleEntries, categories);
    // 500 kg expected - 300 kg sold
    expect(result.remainingStock).toBe(200);
  });

  it("returns null cost-per-unit and full remaining stock when nothing has sold yet", () => {
    const result = cropCycleFinancials(tomatoCycle, tomatoCostCenter, expenseEntries, laborEntries, [], categories);
    expect(result.costPerUnitSold).toBeNull();
    expect(result.remainingStock).toBe(500);
  });

  it("respects a date range filter", () => {
    const result = cropCycleFinancials(
      tomatoCycle,
      tomatoCostCenter,
      expenseEntries,
      laborEntries,
      saleEntries,
      categories,
      { start: "2026-05-15" },
    );
    // Only the second sale (2026-05-20) falls in range
    expect(result.totalRevenue).toBe(4200);
    expect(result.totalCost).toBe(0);
  });
});

describe("householdSpendingByCategory", () => {
  it("only counts general/vehicle/person cost centers — excludes crop cycles and general farm spend", () => {
    const costCenters = [tomatoCostCenter, bikeCostCenter, generalCostCenter, farmCostCenter];
    const expenseEntries = [
      expense({ id: "e1", date: "2026-03-01", costCenterId: tomatoCostCenter.id, categoryId: fertilizer.id, amount: 1200 }),
      expense({ id: "e2", date: "2026-03-02", costCenterId: bikeCostCenter.id, categoryId: fuel.id, amount: 400 }),
      expense({ id: "e3", date: "2026-03-03", costCenterId: generalCostCenter.id, categoryId: groceries.id, amount: 2500 }),
      expense({ id: "e4", date: "2026-03-04", costCenterId: farmCostCenter.id, categoryId: fertilizer.id, amount: 900 }),
    ];
    const result = householdSpendingByCategory(costCenters, expenseEntries, [], categories);
    expect(result).toEqual([
      { categoryId: groceries.id, categoryName: "Groceries", total: 2500 },
      { categoryId: fuel.id, categoryName: "Fuel", total: 400 },
    ]);
  });
});

describe("workerTotals", () => {
  const entries: LaborEntry[] = [
    laborEntry({ id: "l1", date: "2026-01-10", costCenterId: tomatoCostCenter.id, workerId: "w1", daysWorked: 2, dailyRate: 500, amount: 1000 }),
    laborEntry({ id: "l2", date: "2026-02-10", costCenterId: tomatoCostCenter.id, workerId: "w1", daysWorked: 3, dailyRate: 500, amount: 1500 }),
    laborEntry({ id: "l3", date: "2026-02-15", costCenterId: tomatoCostCenter.id, workerId: "w2", daysWorked: 1, dailyRate: 600, amount: 600 }),
  ];

  it("sums totals for one worker across all entries", () => {
    expect(workerTotals("w1", entries)).toEqual({ workerId: "w1", totalPaid: 2500, totalDays: 5, entryCount: 2 });
  });

  it("restricts to a date range (e.g. a single month)", () => {
    expect(workerTotals("w1", entries, { start: "2026-02-01", end: "2026-02-28" })).toEqual({
      workerId: "w1",
      totalPaid: 1500,
      totalDays: 3,
      entryCount: 1,
    });
  });

  it("returns zeros for a worker with no entries", () => {
    expect(workerTotals("w-none", entries)).toEqual({ workerId: "w-none", totalPaid: 0, totalDays: 0, entryCount: 0 });
  });
});

describe("expenseVsRevenueTotals", () => {
  it("sums expense + labor as cost, and sales as revenue, across every cost center", () => {
    const expenseEntries = [
      expense({ id: "e1", date: "2026-03-01", costCenterId: tomatoCostCenter.id, categoryId: fertilizer.id, amount: 1200 }),
      expense({ id: "e2", date: "2026-03-02", costCenterId: generalCostCenter.id, categoryId: groceries.id, amount: 800 }),
    ];
    const laborEntries = [
      laborEntry({ id: "l1", date: "2026-03-03", costCenterId: tomatoCostCenter.id, workerId: "w1", daysWorked: 2, dailyRate: 500, amount: 1000 }),
    ];
    const saleEntries = [
      sale({ id: "s1", date: "2026-05-10", cropCycleId: tomatoCycle.id, quantity: 200, unit: "kg", unitPrice: 40, amount: 8000 }),
    ];
    expect(expenseVsRevenueTotals(expenseEntries, laborEntries, saleEntries)).toEqual({
      totalExpense: 3000,
      totalRevenue: 8000,
    });
  });

  it("respects a date range filter", () => {
    const expenseEntries = [
      expense({ id: "e1", date: "2026-03-01", costCenterId: tomatoCostCenter.id, categoryId: fertilizer.id, amount: 1200 }),
    ];
    const saleEntries = [
      sale({ id: "s1", date: "2026-05-10", cropCycleId: tomatoCycle.id, quantity: 200, unit: "kg", unitPrice: 40, amount: 8000 }),
    ];
    expect(expenseVsRevenueTotals(expenseEntries, [], saleEntries, { start: "2026-05-01" })).toEqual({
      totalExpense: 0,
      totalRevenue: 8000,
    });
  });

  it("returns zeros when there are no entries", () => {
    expect(expenseVsRevenueTotals([], [], [])).toEqual({ totalExpense: 0, totalRevenue: 0 });
  });
});

describe("monthlyCashFlow", () => {
  const expenseEntries = [
    expense({ id: "e1", date: "2026-01-15", costCenterId: tomatoCostCenter.id, categoryId: fertilizer.id, amount: 1000 }),
    expense({ id: "e2", date: "2026-02-10", costCenterId: generalCostCenter.id, categoryId: groceries.id, amount: 500 }),
  ];
  const laborEntries = [
    laborEntry({ id: "l1", date: "2026-01-20", costCenterId: tomatoCostCenter.id, workerId: "w1", daysWorked: 2, dailyRate: 500, amount: 1000 }),
  ];
  const saleEntries = [
    sale({ id: "s1", date: "2026-02-05", cropCycleId: tomatoCycle.id, quantity: 50, unit: "kg", unitPrice: 40, amount: 2000 }),
  ];

  it("buckets entries into the requested YYYY-MM months", () => {
    const result = monthlyCashFlow(expenseEntries, laborEntries, saleEntries, ["2026-01", "2026-02"]);
    expect(result).toEqual([
      { month: "2026-01", totalExpense: 2000, totalRevenue: 0 },
      { month: "2026-02", totalExpense: 500, totalRevenue: 2000 },
    ]);
  });

  it("fills in zeros for a requested month with no activity", () => {
    const result = monthlyCashFlow(expenseEntries, laborEntries, saleEntries, ["2025-12"]);
    expect(result).toEqual([{ month: "2025-12", totalExpense: 0, totalRevenue: 0 }]);
  });

  it("ignores entries outside the requested months", () => {
    const result = monthlyCashFlow(expenseEntries, laborEntries, saleEntries, ["2026-01"]);
    expect(result).toEqual([{ month: "2026-01", totalExpense: 2000, totalRevenue: 0 }]);
  });
});

describe("budgetProgress", () => {
  it("reports 'under' and the remaining amount when comfortably within budget", () => {
    expect(budgetProgress(20000, 50000)).toEqual({
      spent: 20000,
      budgetAmount: 50000,
      remaining: 30000,
      percentUsed: 40,
      status: "under",
    });
  });

  it("reports 'approaching' at 80% or more but under 100%", () => {
    expect(budgetProgress(40000, 50000).status).toBe("approaching"); // exactly 80%
    expect(budgetProgress(39000, 50000).status).toBe("under"); // 78%
  });

  it("reports 'over' with a negative remaining amount once spending exceeds the budget", () => {
    const result = budgetProgress(55000, 50000);
    expect(result.status).toBe("over");
    expect(result.remaining).toBe(-5000);
    expect(result.percentUsed).toBe(110);
  });

  it("treats a zero budget as 0% used rather than dividing by zero", () => {
    expect(budgetProgress(100, 0)).toEqual({ spent: 100, budgetAmount: 0, remaining: -100, percentUsed: 0, status: "under" });
  });
});

describe("filterByDateRange", () => {
  const rows = [{ date: "2026-01-01" }, { date: "2026-06-15" }, { date: "2026-12-31" }];

  it("is inclusive on both ends", () => {
    expect(filterByDateRange(rows, { start: "2026-01-01", end: "2026-06-15" })).toHaveLength(2);
  });

  it("returns everything when no range is given", () => {
    expect(filterByDateRange(rows)).toHaveLength(3);
  });
});
