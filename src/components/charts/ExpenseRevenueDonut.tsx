import { formatMoney } from "@/lib/format";

// Same two-color pair as the mobile app (theme.colors.positive / .negative), already
// run through the dataviz skill's validator: PASS on lightness/chroma/contrast, with
// CVD separation (ΔE 7.0) in the "floor" band — legal only paired with direct labels,
// which this component always shows (never color-alone).
const REVENUE_COLOR = "var(--positive)";
const EXPENSE_COLOR = "var(--negative)";
const GAP_DEGREES = 2; // 2px-equivalent gap between segments, per mark spec

export function ExpenseRevenueDonut({ totalExpense, totalRevenue }: { totalExpense: number; totalRevenue: number }) {
  const total = totalExpense + totalRevenue;
  const size = 180;
  const strokeWidth = 28;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  if (total <= 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
        <div
          className="rounded-full border-[14px] border-border"
          style={{ width: size, height: size }}
          aria-hidden
        />
        <p className="text-sm text-text-secondary">No expense or revenue entries yet.</p>
      </div>
    );
  }

  const revenueFraction = totalRevenue / total;
  const revenueDeg = revenueFraction * 360;
  const gap = total > 0 && totalExpense > 0 && totalRevenue > 0 ? GAP_DEGREES : 0;

  const revenueLength = (circumference * Math.max(revenueDeg - gap, 0)) / 360;
  const expenseLength = circumference - revenueLength - (circumference * gap) / 360;

  return (
    <div className="flex items-center gap-5">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0 -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--border-c)" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={EXPENSE_COLOR}
          strokeWidth={strokeWidth}
          strokeDasharray={`${expenseLength} ${circumference - expenseLength}`}
          strokeDashoffset={-(revenueLength + (circumference * gap) / 360)}
          strokeLinecap="round"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={REVENUE_COLOR}
          strokeWidth={strokeWidth}
          strokeDasharray={`${revenueLength} ${circumference - revenueLength}`}
          strokeDashoffset={0}
          strokeLinecap="round"
        />
      </svg>
      <div className="flex flex-col gap-3">
        <Legend swatch={REVENUE_COLOR} label="Revenue" amount={totalRevenue} percent={(totalRevenue / total) * 100} />
        <Legend swatch={EXPENSE_COLOR} label="Expense" amount={totalExpense} percent={(totalExpense / total) * 100} />
      </div>
    </div>
  );
}

function Legend({ swatch, label, amount, percent }: { swatch: string; label: string; amount: number; percent: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: swatch }} aria-hidden />
      <div>
        <p className="text-sm font-medium text-text-primary">
          {label} <span className="text-text-secondary">({percent.toFixed(0)}%)</span>
        </p>
        <p className="text-sm font-semibold text-text-primary">{formatMoney(amount)}</p>
      </div>
    </div>
  );
}
