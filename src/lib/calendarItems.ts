import type { Category, CategoryGroup, CostCenter, CropCycle, ExpenseEntry, LaborEntry, SaleEntry, Tag, Worker } from "@/domain/types";
import { round2 } from "@/domain/money";
import { DATE_LOCALE, formatDate, formatMoney } from "@/lib/format";
import { CASUAL_COLOR, CASUAL_WORKER, labourName } from "@/lib/labour";
import { workerColor } from "@/lib/workerColors";

// Every entry (labour, sales, expenses) as items for the main calendar: which days each one shows on, how it's
// labelled and coloured, and the details its pop-up lists. Built on the server so the client only gets plain data.

/** The lists the calendar groups a day's entries into, in the order they're shown. */
export type CalendarSection = "labor" | "sale" | CategoryGroup;

export const CALENDAR_SECTIONS: readonly { id: CalendarSection; label: string; color: string }[] = [
  { id: "labor", label: "Labour", color: "#2563eb" },
  { id: "sale", label: "Sales", color: "#16a34a" },
  { id: "agro", label: "Farm expenses", color: "#b45309" },
  { id: "household", label: "Family expenses", color: "#db2777" },
  { id: "other", label: "Other expenses", color: "#6366f1" },
];

export type CalendarItemKind = "labor" | "sale" | "expense";

export interface CalendarItem {
  /** Unique across kinds, e.g. "labor-<id>". */
  id: string;
  entryId: string;
  kind: CalendarItemKind;
  section: CalendarSection;
  /** The entry's own date: when labour was paid, a sale made, an expense spent. */
  date: string;
  /** The days it shows on: a labour entry's work days (or its paid date when none were picked), else its date. */
  days: string[];
  /** Whether `days` are picked work days, which count towards a worker's worked days. */
  hasWorkDates: boolean;
  /** Short text on the calendar itself. */
  label: string;
  title: string;
  subtitle?: string;
  amount: number;
  /** A labour entry's share for one of its days (amount ÷ days shown); the whole amount otherwise. */
  dayAmount: number;
  isRevenue: boolean;
  color: string;
  /** Labour only: the worker's id, or CASUAL_WORKER. */
  workerKey?: string;
  /** Edit page, without a returnTo. */
  editHref: string;
  details: { label: string; value: string }[];
}

/** "৳ 1,500" — like formatMoney, without the paisa when there are none, for tight spaces. */
export function formatMoneyShort(amount: number): string {
  return formatMoney(amount).replace(/\.00$/, "");
}

export const shortDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(DATE_LOCALE, { month: "short", day: "numeric" });

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export function buildCalendarItems({
  expenseEntries,
  laborEntries,
  saleEntries,
  categories,
  tags,
  workers,
  costCenters,
  cropCycles,
}: {
  expenseEntries: ExpenseEntry[];
  laborEntries: LaborEntry[];
  saleEntries: SaleEntry[];
  categories: Category[];
  tags: Tag[];
  workers: Worker[];
  costCenters: CostCenter[];
  cropCycles: CropCycle[];
}): CalendarItem[] {
  const category = (id: string) => categories.find((c) => c.id === id);
  const categoryName = (id: string) => category(id)?.name ?? "Uncategorized";
  const centerName = (id: string) => costCenters.find((c) => c.id === id)?.name ?? "—";
  const cycleName = (id: string) => cropCycles.find((c) => c.id === id)?.label ?? "—";
  const labelNames = (ids: string[]) =>
    ids.map((id) => tags.find((t) => t.id === id)?.name).filter(Boolean).join(", ");
  // Optional rows are left out when empty.
  const rows = (...list: [string, string | undefined][]) =>
    list.filter(([, value]) => value).map(([label, value]) => ({ label, value: value! }));

  const labour = laborEntries.map((e): CalendarItem => {
    const name = labourName(e, workers);
    const worker = workers.find((w) => w.id === e.workerId);
    const days = e.workDates.length > 0 ? e.workDates : [e.date];
    return {
      id: `labor-${e.id}`,
      entryId: e.id,
      kind: "labor",
      section: "labor",
      date: e.date,
      days,
      hasWorkDates: e.workDates.length > 0,
      label: name,
      title: name,
      subtitle: [
        categoryName(e.categoryId),
        `${plural(e.daysWorked, "day")} × ${formatMoneyShort(e.dailyRate)}`,
        days.length > 1 ? `${formatMoneyShort(e.amount)} in all` : undefined,
      ]
        .filter(Boolean)
        .join(" · "),
      amount: e.amount,
      dayAmount: round2(e.amount / days.length),
      isRevenue: false,
      color: worker ? workerColor(worker) : CASUAL_COLOR,
      workerKey: e.workerId ?? CASUAL_WORKER,
      editHref: `/labor/${e.id}/edit`,
      details: rows(
        ["Worker", e.workerId ? name : `${name} (casual)`],
        ["Tag", categoryName(e.categoryId)],
        ["For", centerName(e.costCenterId)],
        ["Paid on", formatDate(e.date)],
        ["Work days", e.workDates.length > 0 ? e.workDates.map(shortDate).join(", ") : "None picked"],
        ["Days worked", String(e.daysWorked)],
        ["Daily rate", formatMoney(e.dailyRate)],
        ["Labels", labelNames(e.tagIds)],
        ["Note", e.note],
      ),
    };
  });

  const sales = saleEntries.map((e): CalendarItem => {
    const cycle = cycleName(e.cropCycleId);
    return {
      id: `sale-${e.id}`,
      entryId: e.id,
      kind: "sale",
      section: "sale",
      date: e.date,
      days: [e.date],
      hasWorkDates: false,
      label: `${cycle} ${formatMoneyShort(e.amount)}`,
      title: e.buyer ? `${cycle} · ${e.buyer}` : cycle,
      subtitle: `${e.quantity} ${e.unit} × ${formatMoneyShort(e.unitPrice)}`,
      amount: e.amount,
      dayAmount: e.amount,
      isRevenue: true,
      color: CALENDAR_SECTIONS[1].color,
      editHref: `/sales/${e.id}/edit`,
      details: rows(
        ["Crop cycle", cycle],
        ["Category", categoryName(e.categoryId)],
        ["Date", formatDate(e.date)],
        ["Buyer", e.buyer],
        ["Quantity", `${e.quantity} ${e.unit}`],
        ["Unit price", formatMoney(e.unitPrice)],
        ["Labels", labelNames(e.tagIds)],
        ["Note", e.note],
      ),
    };
  });

  const expenses = expenseEntries.map((e): CalendarItem => {
    const section: CalendarSection = category(e.categoryId)?.group ?? "other";
    const name = categoryName(e.categoryId);
    const meta = CALENDAR_SECTIONS.find((s) => s.id === section)!;
    return {
      id: `expense-${e.id}`,
      entryId: e.id,
      kind: "expense",
      section,
      date: e.date,
      days: [e.date],
      hasWorkDates: false,
      label: `${name} ${formatMoneyShort(e.amount)}`,
      title: name,
      subtitle: [centerName(e.costCenterId), e.note].filter(Boolean).join(" · "),
      amount: e.amount,
      dayAmount: e.amount,
      isRevenue: false,
      color: meta.color,
      editHref: `/expenses/${e.id}/edit`,
      details: rows(
        ["Category", meta.label],
        ["Tag", name],
        ["For", centerName(e.costCenterId)],
        ["Date", formatDate(e.date)],
        ["Labels", labelNames(e.tagIds)],
        ["Note", e.note],
      ),
    };
  });

  return [...labour, ...sales, ...expenses];
}

/** A day's items, grouped into sections in display order (empty sections left out). */
export function itemsBySection(items: CalendarItem[]) {
  return CALENDAR_SECTIONS.map((section) => ({ ...section, items: items.filter((i) => i.section === section.id) })).filter(
    (s) => s.items.length > 0,
  );
}

/** What went out and came in on one day, counting each labour entry's share for that day. */
export function dayTotals(items: CalendarItem[]) {
  return {
    spent: round2(items.filter((i) => !i.isRevenue).reduce((sum, i) => sum + i.dayAmount, 0)),
    earned: round2(items.filter((i) => i.isRevenue).reduce((sum, i) => sum + i.dayAmount, 0)),
  };
}
