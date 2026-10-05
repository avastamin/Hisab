import type { Category, CategoryGroup, MoneyEntry, Tag } from "./types";
import { round2, sum } from "./money";

/**
 * Spending is organised in two levels: a handful of categories (Agro, Household, Other) and, under each, the tags
 * an entry is booked to (Agro → Labour, Pesticide, …). In the database the tags are rows of the `categories`
 * table with a `category_group`; every cost entry points at exactly one of them, so per-tag totals always add up
 * to the category total. Optional cross-cutting labels (Organic, Wholesale, …) live in the `tags` table.
 */
export const CATEGORY_GROUPS: readonly { id: CategoryGroup; label: string }[] = [
  { id: "agro", label: "Agro" },
  { id: "household", label: "Household" },
  { id: "other", label: "Other" },
];

export function categoryGroupLabel(group: CategoryGroup): string {
  return CATEGORY_GROUPS.find((g) => g.id === group)?.label ?? "Other";
}

const AGRO = [
  "labour", "labor", "seeds", "seed", "nursery / saplings", "saplings", "fertilizer", "chemical fertilizer",
  "organic fertilizer", "cowdung", "pesticide", "pesticides", "herbicide", "fungicide", "irrigation", "equipment",
  "equipment / tools", "land rent", "transport",
];
const HOUSEHOLD = [
  "groceries", "fish", "meat", "vegetables", "dairy & eggs", "processed foods", "medicine", "education", "fuel",
  "utilities", "house rent", "clothing", "mobile / internet",
];

/**
 * Best guess at the category of a tag from its name, for rows created before categories existed. Must stay in
 * step with the CASE in supabase/migrations/20261005_category_groups.sql.
 */
export function inferCategoryGroup(name: string): CategoryGroup {
  const key = name.trim().toLowerCase();
  if (AGRO.includes(key)) return "agro";
  if (HOUSEHOLD.includes(key)) return "household";
  return "other";
}

export interface TagTotal {
  categoryId: string;
  name: string;
  total: number;
}

export interface GroupSpending {
  group: CategoryGroup;
  label: string;
  total: number;
  /** Highest first. */
  tags: TagTotal[];
}

/** Spending per category (Agro / Household / Other), each broken down by tag. Categories with nothing spent are left out. */
export function spendingByGroup(entries: readonly MoneyEntry[], categories: readonly Category[]): GroupSpending[] {
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const byTag = new Map<string, number>();
  for (const e of entries) byTag.set(e.categoryId, round2((byTag.get(e.categoryId) ?? 0) + e.amount));

  return CATEGORY_GROUPS.map(({ id, label }) => {
    const tags = [...byTag.entries()]
      .filter(([categoryId]) => (categoryById.get(categoryId)?.group ?? "other") === id)
      .map(([categoryId, total]) => ({ categoryId, name: categoryById.get(categoryId)?.name ?? "Uncategorized", total }))
      .sort((a, b) => b.total - a.total);
    return { group: id, label, total: sum(tags.map((t) => t.total)), tags };
  }).filter((g) => g.tags.length > 0);
}

export interface LabelTotal {
  tagId: string;
  name: string;
  total: number;
  count: number;
}

/**
 * Spending per optional label. An entry with two labels counts under both, so these totals are not meant to be
 * added together — each answers "how much went on things labelled X?".
 */
export function spendingByLabel(entries: readonly MoneyEntry[], labels: readonly Tag[]): LabelTotal[] {
  return labels
    .map((label) => {
      const matching = entries.filter((e) => e.tagIds.includes(label.id));
      return { tagId: label.id, name: label.name, total: sum(matching.map((e) => e.amount)), count: matching.length };
    })
    .filter((l) => l.count > 0)
    .sort((a, b) => b.total - a.total);
}
