import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Category, CostCenter, ExpenseEntry, LaborEntry, SaleEntry, Worker, CropCycle } from "@/domain/types";
import { formatDate, formatMoney } from "@/lib/format";

export interface EntryItem {
  key: string;
  href: string;
  date: string;
  title: string;
  detail?: string;
  amount: number;
  isRevenue: boolean;
}

/**
 * Turns expenses, labour and sales into one newest-first list of rows that link to their edit pages.
 * `returnTo` is where the edit page goes back to after saving or deleting. With `showWhere`, each row also says
 * what it was for (cost center / crop cycle), for lists that mix several of them.
 */
export function buildEntryItems({
  expenseEntries,
  laborEntries,
  saleEntries,
  categories,
  workers,
  costCenters,
  cropCycles,
  returnTo,
  showWhere = false,
}: {
  expenseEntries: ExpenseEntry[];
  laborEntries: LaborEntry[];
  saleEntries: SaleEntry[];
  categories: Category[];
  workers: Worker[];
  costCenters: CostCenter[];
  cropCycles: CropCycle[];
  returnTo: string;
  showWhere?: boolean;
}): EntryItem[] {
  const back = encodeURIComponent(returnTo);
  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? "Uncategorized";
  const centerName = (id: string) => costCenters.find((c) => c.id === id)?.name;
  const cycleName = (id: string) => cropCycles.find((c) => c.id === id)?.label;
  const withWhere = (detail: string | undefined, where: string | undefined) =>
    [showWhere ? where : undefined, detail].filter(Boolean).join(" · ") || undefined;

  return [
    ...expenseEntries.map((e) => ({
      key: `expense-${e.id}`,
      href: `/expenses/${e.id}/edit?returnTo=${back}`,
      date: e.date,
      title: categoryName(e.categoryId),
      detail: withWhere(e.note, centerName(e.costCenterId)),
      amount: e.amount,
      isRevenue: false,
    })),
    ...laborEntries.map((e) => ({
      key: `labor-${e.id}`,
      href: `/labor/${e.id}/edit?returnTo=${back}`,
      date: e.date,
      title: `${workers.find((w) => w.id === e.workerId)?.name ?? "Worker"} · ${categoryName(e.categoryId)}`,
      detail: withWhere(
        `${e.daysWorked} day${e.daysWorked === 1 ? "" : "s"} × ${formatMoney(e.dailyRate)}`,
        centerName(e.costCenterId),
      ),
      amount: e.amount,
      isRevenue: false,
    })),
    ...saleEntries.map((e) => ({
      key: `sale-${e.id}`,
      href: `/sales/${e.id}/edit?returnTo=${back}`,
      date: e.date,
      title: e.buyer ? `Sale · ${e.buyer}` : "Sale",
      detail: withWhere(`${e.quantity} ${e.unit} × ${formatMoney(e.unitPrice)}`, cycleName(e.cropCycleId)),
      amount: e.amount,
      isRevenue: true,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));
}

export function EntryList({ entries, emptyText }: { entries: EntryItem[]; emptyText: string }) {
  if (entries.length === 0) return <p className="text-sm text-text-secondary">{emptyText}</p>;

  return (
    <>
      <p className="mb-2 text-xs text-text-secondary">Tap an entry to edit or delete it.</p>
      <ul className="divide-y divide-border">
        {entries.map((e) => (
          <li key={e.key}>
            <Link href={e.href} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-text-primary">{e.title}</p>
                <p className="truncate text-xs text-text-secondary">
                  {formatDate(e.date)}
                  {e.detail ? ` · ${e.detail}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <span className={e.isRevenue ? "text-sm font-semibold text-positive" : "text-sm font-semibold text-negative"}>
                  {e.isRevenue ? "+" : "−"}
                  {formatMoney(e.amount)}
                </span>
                <ChevronRight size={16} className="text-text-secondary" />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
