import type { MonthlyCashFlow } from "@/domain/calculations";
import { formatMoney } from "@/lib/format";

const REVENUE_COLOR = "var(--positive)";
const EXPENSE_COLOR = "var(--negative)";

function monthLabel(month: string): string {
  const [year, m] = month.split("-");
  return new Date(Number(year), Number(m) - 1, 1).toLocaleDateString(undefined, { month: "short" });
}

export function MonthlyCashFlowChart({ data }: { data: MonthlyCashFlow[] }) {
  const max = Math.max(1, ...data.map((d) => Math.max(d.totalExpense, d.totalRevenue)));

  return (
    <div>
      {/* Columns stretch to the full 140px so the bars' percentage heights have something to resolve against. */}
      <div className="flex justify-between gap-3" style={{ height: 140 }}>
        {data.map((d) => (
          <div key={d.month} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex min-h-0 w-full flex-1 items-end justify-center gap-1">
              <Bar value={d.totalRevenue} max={max} color={REVENUE_COLOR} label="Revenue" />
              <Bar value={d.totalExpense} max={max} color={EXPENSE_COLOR} label="Expense" />
            </div>
            <span className="text-[11px] font-medium text-text-secondary">{monthLabel(d.month)}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-center gap-5">
        <LegendDot color={REVENUE_COLOR} label="Revenue" />
        <LegendDot color={EXPENSE_COLOR} label="Expense" />
      </div>
    </div>
  );
}

function Bar({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
  const heightPct = Math.max((value / max) * 100, value > 0 ? 3 : 0);
  return (
    <div className="group relative w-3 rounded-t-[4px]" style={{ height: `${heightPct}%`, backgroundColor: color, minHeight: value > 0 ? 4 : 0 }}>
      <span className="pointer-events-none absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-text-primary px-2 py-1 text-[11px] font-medium text-bg opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
        {label}: {formatMoney(value)}
      </span>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} aria-hidden />
      <span className="text-xs font-medium text-text-secondary">{label}</span>
    </div>
  );
}
