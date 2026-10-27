"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Loader2 } from "lucide-react";
import { CHART_RANGES, type ChartPeriod } from "@/lib/format";
import { TextInput } from "@/components/form/Field";

const LABELS: Record<(typeof CHART_RANGES)[number], [short: string, full: string]> = {
  1: ["1M", "1 month"],
  3: ["3M", "3 months"],
  6: ["6M", "6 months"],
  12: ["12M", "12 months"],
};

// The Home charts' period: preset months, or a custom start and end date. Changing it navigates (so the URL can be
// shared and the server works out the totals) inside a transition, which drives the spinners while it loads.
export function ChartRangeControl({ period, span }: { period: Pick<ChartPeriod, "range" | "start" | "end">; span: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [target, setTarget] = useState<string | null>(null);
  const [showCustom, setShowCustom] = useState(period.range === "custom");
  const [from, setFrom] = useState(period.start);
  const [to, setTo] = useState(period.end);

  function go(href: string, key: string) {
    setTarget(key);
    startTransition(() => router.push(href, { scroll: false }));
  }

  const chip = (active: boolean) =>
    clsx(
      "inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs",
      active ? "bg-primary font-semibold text-primary-text" : "font-medium text-text-secondary hover:text-text-primary",
    );
  const spinner = (key: string) =>
    isPending && target === key ? <Loader2 size={12} className="animate-spin" aria-hidden /> : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-text-secondary">{span}</p>
        <nav aria-label="Chart range" className="flex rounded-lg border border-border bg-surface p-0.5">
          {CHART_RANGES.map((r) => {
            const active = !showCustom && period.range === r;
            return (
              <button
                key={r}
                type="button"
                aria-current={active ? "page" : undefined}
                aria-label={LABELS[r][1]}
                onClick={() => {
                  setShowCustom(false);
                  if (period.range !== r) go(r === 12 ? "/" : `/?range=${r}`, String(r));
                }}
                className={chip(active)}
              >
                {spinner(String(r))}
                <span className="sm:hidden">{LABELS[r][0]}</span>
                <span className="hidden sm:inline">{LABELS[r][1]}</span>
              </button>
            );
          })}
          <button
            type="button"
            aria-current={showCustom ? "page" : undefined}
            aria-expanded={showCustom}
            onClick={() => setShowCustom(true)}
            className={chip(showCustom)}
          >
            Custom
          </button>
        </nav>
      </div>

      {showCustom ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            go(`/?${new URLSearchParams({ range: "custom", from, to })}`, "custom");
          }}
          className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-3"
        >
          <label className="flex min-w-36 flex-1 flex-col gap-1 text-xs font-medium text-text-secondary">
            Start date
            <TextInput type="date" required value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label className="flex min-w-36 flex-1 flex-col gap-1 text-xs font-medium text-text-secondary">
            End date
            <TextInput type="date" required value={to} min={from} onChange={(e) => setTo(e.target.value)} />
          </label>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-text hover:brightness-110 disabled:cursor-wait disabled:opacity-70"
          >
            {spinner("custom")}
            Apply
          </button>
        </form>
      ) : null}
    </div>
  );
}
