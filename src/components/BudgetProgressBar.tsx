import { budgetProgress } from "@/domain/calculations";
import { formatMoney } from "@/lib/format";
import clsx from "clsx";

const STATUS_COLOR: Record<string, string> = {
  under: "var(--positive)",
  approaching: "var(--warning)",
  over: "var(--negative)",
};

export function BudgetProgressBar({ spent, budgetAmount }: { spent: number; budgetAmount: number }) {
  const progress = budgetProgress(spent, budgetAmount);
  const widthPct = Math.min(Math.max(progress.percentUsed, 0), 100);

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-medium text-text-secondary">This month&apos;s spend</p>
        <p className="text-sm font-semibold text-text-primary">
          {formatMoney(progress.spent)} <span className="text-text-secondary">/ {formatMoney(progress.budgetAmount)}</span>
        </p>
      </div>
      <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-surface-alt">
        <div
          className="h-full rounded-full transition-[width]"
          style={{ width: `${widthPct}%`, backgroundColor: STATUS_COLOR[progress.status] }}
        />
      </div>
      <p
        className={clsx(
          "mt-1.5 text-xs font-medium",
          progress.status === "over" ? "text-negative" : "text-text-secondary",
        )}
      >
        {progress.status === "over"
          ? `${formatMoney(Math.abs(progress.remaining))} over budget`
          : `${formatMoney(progress.remaining)} remaining`}
      </p>
    </div>
  );
}
