"use client";

import { useState } from "react";
import clsx from "clsx";
import type { MonthlyCashFlow } from "@/domain/calculations";
import { DATE_LOCALE, formatMoney } from "@/lib/format";

const REVENUE_COLOR = "var(--positive)";
const EXPENSE_COLOR = "var(--negative)";

/** "Oct", "Oct 2026" (full) or "Jan '26" (axis): never "Oct 26", which reads like a day. */
function monthName(month: string, style: "short" | "full" | "axis-year"): string {
  const [year, m] = month.split("-").map(Number);
  const short = new Date(year, m - 1, 1).toLocaleDateString(DATE_LOCALE, { month: "short" });
  if (style === "full") return `${short} ${year}`;
  if (style === "axis-year") return `${short} '${String(year).slice(2)}`;
  return short;
}

/**
 * Revenue vs expense per month, for 12 to 36 months on a phone-width card. Bars are capped at 12px with a 2px gap
 * and thin out as the range grows; month labels thin out too (always keeping the latest month, and marking each
 * new year). Hover or tap a month to see its exact figures below the chart; tapping works where hover doesn't.
 */
export function MonthlyCashFlowChart({ data }: { data: MonthlyCashFlow[] }) {
  const latest = data.length - 1;
  const [selected, setSelected] = useState<number>(latest);
  const [hovered, setHovered] = useState<number | null>(null);
  const active = data[hovered ?? selected];

  const max = Math.max(1, ...data.map((d) => Math.max(d.totalExpense, d.totalRevenue)));
  // Label roughly six months across, counting back from the latest so the current month is always named.
  const labelEvery = Math.max(1, Math.ceil(data.length / 6));
  const isLabelled = (i: number) => (latest - i) % labelEvery === 0;
  // Year on the first label and wherever the year changes, so repeating month names stay unambiguous.
  const firstLabelled = data.findIndex((_, i) => isLabelled(i));
  const showsYear = (i: number) => {
    if (i === firstLabelled) return true;
    const previous = data.findLastIndex((_, j) => j < i && isLabelled(j));
    return previous >= 0 && data[previous].month.slice(0, 4) !== data[i].month.slice(0, 4);
  };

  return (
    <div>
      <div className={clsx("flex border-b border-border", data.length > 12 ? "gap-px" : "gap-1")} style={{ height: 140 }}>
        {data.map((d, i) => (
          <button
            key={d.month}
            type="button"
            onClick={() => setSelected(i)}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            onFocus={() => setHovered(i)}
            onBlur={() => setHovered(null)}
            aria-label={`${monthName(d.month, "full")}: revenue ${formatMoney(d.totalRevenue)}, expense ${formatMoney(d.totalExpense)}`}
            aria-pressed={i === selected}
            className={clsx(
              "flex min-w-0 flex-1 items-end justify-center gap-[2px] rounded-t-sm outline-none",
              i === (hovered ?? selected) ? "bg-surface-alt" : "",
            )}
          >
            <Bar value={d.totalRevenue} max={max} color={REVENUE_COLOR} />
            <Bar value={d.totalExpense} max={max} color={EXPENSE_COLOR} />
          </button>
        ))}
      </div>

      <div className={clsx("mt-1 flex", data.length > 12 ? "gap-px" : "gap-1")} aria-hidden>
        {data.map((d, i) => (
          <span key={d.month} className="relative h-4 min-w-0 flex-1">
            {isLabelled(i) ? (
              <span className="absolute left-1/2 top-0 -translate-x-1/2 whitespace-nowrap text-[11px] font-medium text-text-secondary">
                {monthName(d.month, showsYear(i) ? "axis-year" : "short")}
              </span>
            ) : null}
          </span>
        ))}
      </div>

      {active ? (
        <div className="mt-3 flex items-center justify-between gap-2 rounded-lg bg-surface-alt px-3 py-2 text-xs">
          <span className="font-semibold text-text-primary">{monthName(active.month, "full")}</span>
          <span className="flex flex-wrap justify-end gap-x-3 gap-y-0.5 text-text-secondary">
            <span>
              <Dot color={REVENUE_COLOR} /> {formatMoney(active.totalRevenue)}
            </span>
            <span>
              <Dot color={EXPENSE_COLOR} /> {formatMoney(active.totalExpense)}
            </span>
            <span className="font-semibold text-text-primary">Net {formatMoney(active.totalRevenue - active.totalExpense)}</span>
          </span>
        </div>
      ) : null}

      <div className="mt-3 flex items-center justify-center gap-5">
        <LegendDot color={REVENUE_COLOR} label="Revenue" />
        <LegendDot color={EXPENSE_COLOR} label="Expense" />
      </div>
    </div>
  );
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  if (value <= 0) return <span className="w-full max-w-[12px] flex-1" aria-hidden />;
  return (
    <span
      className="w-full max-w-[12px] flex-1 rounded-t-[4px]"
      style={{ height: `${Math.max((value / max) * 100, 3)}%`, minHeight: 3, backgroundColor: color }}
      aria-hidden
    />
  );
}

function Dot({ color }: { color: string }) {
  return <span className="inline-block h-2 w-2 rounded-full align-middle" style={{ backgroundColor: color }} aria-hidden />;
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} aria-hidden />
      <span className="text-xs font-medium text-text-secondary">{label}</span>
    </div>
  );
}
