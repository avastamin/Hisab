import { describe, expect, it } from "vitest";
import type { Category, ExpenseEntry, LaborEntry, SaleEntry, Worker } from "@/domain/types";
import { buildCalendarItems, dayTotals, formatMoneyShort, itemsBySection } from "@/lib/calendarItems";
import { CASUAL_COLOR, CASUAL_WORKER, labourName } from "@/lib/labour";

const created = "2026-11-01T00:00:00Z";
const categories: Category[] = [
  { id: "c-labour", name: "Labour", kind: "cost", group: "agro", isBuiltIn: true, createdAt: created },
  { id: "c-fish", name: "Fish", kind: "cost", group: "household", isBuiltIn: true, createdAt: created },
  { id: "c-sale", name: "Harvest Sale", kind: "revenue", isBuiltIn: true, createdAt: created },
];
const workers: Worker[] = [{ id: "w1", name: "Jharu", color: "#2563eb", createdAt: created }];

const labour = (over: Partial<LaborEntry>): LaborEntry => ({
  id: "l1",
  kind: "labor",
  date: "2026-11-05",
  costCenterId: "cc",
  categoryId: "c-labour",
  tagIds: [],
  workerId: "w1",
  daysWorked: 2,
  dailyRate: 500,
  workDates: ["2026-11-03", "2026-11-04"],
  amount: 1000,
  createdAt: created,
  ...over,
});
const expense: ExpenseEntry = {
  id: "e1",
  kind: "expense",
  date: "2026-11-04",
  costCenterId: "cc",
  categoryId: "c-fish",
  tagIds: [],
  amount: 350,
  createdAt: created,
};
const sale: SaleEntry = {
  id: "s1",
  date: "2026-11-04",
  cropCycleId: "cy",
  categoryId: "c-sale",
  tagIds: [],
  quantity: 10,
  unit: "kg",
  unitPrice: 120,
  amount: 1200,
  createdAt: created,
};

const build = (laborEntries: LaborEntry[]) =>
  buildCalendarItems({
    expenseEntries: [expense],
    laborEntries,
    saleEntries: [sale],
    categories,
    tags: [],
    workers,
    costCenters: [],
    cropCycles: [{ id: "cy", cropId: "x", label: "Tomato Winter", status: "growing", startDate: "2026-10-01", createdAt: created }],
  });

describe("labourName", () => {
  it("uses the saved worker, then the casual label, then a default", () => {
    expect(labourName({ workerId: "w1" }, workers)).toBe("Jharu");
    expect(labourName({ workerLabel: "Helper 2" }, workers)).toBe("Helper 2");
    expect(labourName({}, workers)).toBe("Casual worker");
  });
});

describe("buildCalendarItems", () => {
  it("shows labour on its work days with a per-day share, and other entries on their date", () => {
    const items = build([labour({})]);
    const l = items.find((i) => i.kind === "labor")!;
    expect(l.days).toEqual(["2026-11-03", "2026-11-04"]);
    expect(l.dayAmount).toBe(500);
    expect(l.hasWorkDates).toBe(true);
    expect(items.find((i) => i.kind === "expense")).toMatchObject({ section: "household", days: ["2026-11-04"], label: "Fish ৳ 350" });
    expect(items.find((i) => i.kind === "sale")).toMatchObject({ section: "sale", isRevenue: true, title: "Tomato Winter" });
  });

  it("puts labour without work days on the day it was paid", () => {
    const l = build([labour({ workDates: [] })]).find((i) => i.kind === "labor")!;
    expect(l).toMatchObject({ days: ["2026-11-05"], hasWorkDates: false, dayAmount: 1000 });
  });

  it("gives casual workers their label and the shared colour", () => {
    const l = build([labour({ workerId: undefined, workerLabel: "Rahim" })]).find((i) => i.kind === "labor")!;
    expect(l).toMatchObject({ title: "Rahim", workerKey: CASUAL_WORKER, color: CASUAL_COLOR });
    expect(l.details[0]).toEqual({ label: "Worker", value: "Rahim (casual)" });
  });

  it("groups a day by section and totals it", () => {
    const day = build([labour({})]).filter((i) => i.days.includes("2026-11-04"));
    expect(itemsBySection(day).map((s) => s.id)).toEqual(["labor", "sale", "household"]);
    expect(dayTotals(day)).toEqual({ spent: 850, earned: 1200 });
  });
});

describe("formatMoneyShort", () => {
  it("drops zero paisa only", () => {
    expect(formatMoneyShort(1500)).toBe("৳ 1,500");
    expect(formatMoneyShort(12.5)).toBe("৳ 12.50");
  });
});
