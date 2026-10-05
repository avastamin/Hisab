import { readFileSync } from "node:fs";
import { join } from "node:path";
import { categoryGroupLabel, inferCategoryGroup, spendingByGroup, spendingByLabel } from "../categoryGroups";
import type { Category, CategoryGroup, ExpenseEntry, LaborEntry, Tag } from "../types";

const at = "2026-01-01T00:00:00.000Z";
const tag = (id: string, name: string, group: CategoryGroup): Category => ({
  id,
  name,
  kind: "cost",
  group,
  isBuiltIn: true,
  createdAt: at,
});
const pesticide = tag("pesticide", "Pesticide", "agro");
const labour = tag("labour", "Labour", "agro");
const fish = tag("fish", "Fish", "household");
const travel = tag("travel", "Travel", "other");
const categories = [pesticide, labour, fish, travel];

const expense = (id: string, categoryId: string, amount: number, tagIds: string[] = []): ExpenseEntry => ({
  id,
  kind: "expense",
  date: "2026-10-01",
  costCenterId: "cc",
  categoryId,
  tagIds,
  amount,
  createdAt: at,
});
const labourEntry = (id: string, amount: number, tagIds: string[] = []): LaborEntry => ({
  id,
  kind: "labor",
  date: "2026-10-01",
  costCenterId: "cc",
  categoryId: "labour",
  tagIds,
  workerId: "w1",
  daysWorked: 2,
  dailyRate: amount / 2,
  amount,
  createdAt: at,
});

describe("inferCategoryGroup", () => {
  it.each([
    ["Labor", "agro"],
    ["Labour", "agro"],
    ["  pesticides ", "agro"],
    ["Cowdung", "agro"],
    ["Fish", "household"],
    ["Mobile / Internet", "household"],
    ["Bike Repair", "other"],
    ["Other", "other"],
  ] as const)("puts %s under %s", (name, group) => {
    expect(inferCategoryGroup(name)).toBe(group);
  });

  it("matches the CASE in the SQL migration, so existing rows land where new ones would", () => {
    const sql = readFileSync(join(__dirname, "../../../supabase/migrations/20261005_category_groups.sql"), "utf8");
    const listFor = (group: string) => {
      const match = sql.match(new RegExp(`when lower\\(trim\\(name\\)\\) in \\(([^)]*)\\) then '${group}'`));
      expect(match).not.toBeNull();
      return match![1].split(",").map((s) => s.trim().replace(/^'|'$/g, "").replace(/''/g, "'"));
    };
    for (const name of listFor("agro")) expect(inferCategoryGroup(name)).toBe("agro");
    for (const name of listFor("household")) expect(inferCategoryGroup(name)).toBe("household");
  });
});

describe("categoryGroupLabel", () => {
  it("names each category", () => {
    expect(categoryGroupLabel("agro")).toBe("Agro");
    expect(categoryGroupLabel("household")).toBe("Household");
    expect(categoryGroupLabel("other")).toBe("Other");
  });
});

describe("spendingByGroup", () => {
  const entries = [
    expense("e1", "pesticide", 800),
    expense("e2", "pesticide", 200),
    labourEntry("l1", 1200),
    expense("e3", "fish", 900),
  ];

  it("totals each category from its tags, highest tag first", () => {
    const result = spendingByGroup(entries, categories);
    expect(result.map((g) => [g.group, g.total])).toEqual([
      ["agro", 2200],
      ["household", 900],
    ]);
    expect(result[0].tags).toEqual([
      { categoryId: "labour", name: "Labour", total: 1200 },
      { categoryId: "pesticide", name: "Pesticide", total: 1000 },
    ]);
  });

  it("adds up to exactly what was spent", () => {
    const result = spendingByGroup(entries, categories);
    const spent = entries.reduce((s, e) => s + e.amount, 0);
    expect(result.reduce((s, g) => s + g.total, 0)).toBe(spent);
    for (const g of result) expect(g.tags.reduce((s, t) => s + t.total, 0)).toBe(g.total);
  });

  it("leaves out categories with no spending, and files unknown tags under Other", () => {
    const result = spendingByGroup([expense("e1", "deleted-tag", 50)], categories);
    expect(result).toEqual([
      { group: "other", label: "Other", total: 50, tags: [{ categoryId: "deleted-tag", name: "Uncategorized", total: 50 }] },
    ]);
  });

  it("returns nothing for no entries", () => {
    expect(spendingByGroup([], categories)).toEqual([]);
  });
});

describe("spendingByLabel", () => {
  const organic: Tag = { id: "organic", name: "Organic", createdAt: at };
  const wholesale: Tag = { id: "wholesale", name: "Wholesale", createdAt: at };
  const unused: Tag = { id: "eid", name: "Festival / Eid", createdAt: at };

  it("counts an entry under every label it has, and skips unused labels", () => {
    const result = spendingByLabel(
      [expense("e1", "pesticide", 300, ["organic", "wholesale"]), expense("e2", "fish", 100, ["organic"]), expense("e3", "fish", 999)],
      [organic, wholesale, unused],
    );
    expect(result).toEqual([
      { tagId: "organic", name: "Organic", total: 400, count: 2 },
      { tagId: "wholesale", name: "Wholesale", total: 300, count: 1 },
    ]);
  });
});
