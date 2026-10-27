"use client";

import { useState } from "react";
import clsx from "clsx";
import { Plus, X } from "lucide-react";
import type { Worker } from "@/domain/types";
import { laborEntryAmount, round2 } from "@/domain/money";
import { formatDate, formatMoney } from "@/lib/format";
import { workerColor } from "@/lib/workerColors";
import { addDates, sharedDates, toggleDate } from "@/lib/workDates";
import { Field, Select, TextInput } from "@/components/form/Field";
import { WorkCalendar, type CalendarMark } from "@/components/calendar/WorkCalendar";

/** Days already recorded in other labour entries, shown faintly on the calendar for context. */
export interface OtherWorkDays {
  workerId: string;
  workDates: string[];
}

interface Row {
  key: number;
  workerId: string;
  dates: string[];
  days: string;
  /** Set once "Days worked" is typed in, e.g. for half days; until then it follows the number of picked days. */
  daysTouched: boolean;
  rate: string;
}

// Worker, work days and daily rate for the Labour form and the Expense form's Labour tag. Each worker row submits
// workerId / daysWorked / dailyRate / workDates fields in the same order, and the actions save one labour entry per
// row. Days are picked on the calendar for whichever worker is active; each worker has their own colour.
export function LabourFields({
  workers,
  otherWorkDays,
  entry,
  initialRate,
  multiple,
}: {
  workers: Worker[];
  otherWorkDays: OtherWorkDays[];
  /** The labour entry being edited. */
  entry?: { workerId: string; workDates: string[]; daysWorked: number; dailyRate: number };
  initialRate?: string;
  /** Whether more workers can be added (a new entry), or it's one worker only (editing one entry). */
  multiple: boolean;
}) {
  const [rows, setRows] = useState<Row[]>(() => [
    {
      key: 0,
      workerId: entry?.workerId ?? "",
      dates: entry?.workDates ?? [],
      days: String(entry?.daysWorked ?? 1),
      daysTouched: !!entry && entry.workDates.length > 0 && entry.workDates.length !== entry.daysWorked,
      rate: entry ? String(entry.dailyRate) : (initialRate ?? ""),
    },
  ]);
  const [activeKey, setActiveKey] = useState(0);
  const active = rows.find((r) => r.key === activeKey) ?? rows[0];

  const worker = (id: string) => workers.find((w) => w.id === id);
  const colorOf = (id: string) => {
    const w = worker(id);
    return w ? workerColor(w) : "var(--text-secondary)";
  };
  const otherDatesOf = (id: string) => otherWorkDays.filter((o) => o.workerId === id).flatMap((o) => o.workDates);

  function update(key: number, change: (row: Row) => Partial<Row>) {
    setRows((current) => current.map((r) => (r.key === key ? { ...r, ...change(r) } : r)));
  }

  function setDates(row: Row, dates: string[]): Partial<Row> {
    return { dates, days: !row.daysTouched && dates.length > 0 ? String(dates.length) : row.days };
  }

  function chooseWorker(key: number, workerId: string) {
    const rate = worker(workerId)?.defaultDailyRate;
    update(key, (r) => ({ workerId, rate: !r.rate && rate !== undefined ? String(rate) : r.rate }));
    setActiveKey(key);
  }

  function pickDates(dates: string[], range: boolean) {
    if (!active.workerId) return;
    // A dragged range always adds; a single tap toggles.
    update(active.key, (r) => setDates(r, range ? addDates(r.dates, dates) : toggleDate(r.dates, dates[0])));
  }

  function addRow() {
    const key = Math.max(...rows.map((r) => r.key)) + 1;
    setRows((current) => [...current, { key, workerId: "", dates: [], days: "1", daysTouched: false, rate: "" }]);
    setActiveKey(key);
  }

  function removeRow(key: number) {
    const remaining = rows.filter((r) => r.key !== key);
    setRows(remaining);
    if (key === activeKey) setActiveKey(remaining[0].key);
  }

  const chosen = new Set(rows.map((r) => r.workerId));
  const marks: CalendarMark[] = [
    ...rows.flatMap((r) =>
      r.workerId
        ? r.dates.map((date) => ({
            date,
            workerId: r.workerId,
            label: worker(r.workerId)?.name ?? "",
            color: colorOf(r.workerId),
            solid: true,
          }))
        : [],
    ),
    // Other entries' days, unless the same worker is picked for that day here too.
    ...otherWorkDays.flatMap((o) =>
      o.workDates
        .filter((date) => !rows.some((r) => r.workerId === o.workerId && r.dates.includes(date)))
        .map((date) => ({
          date,
          workerId: o.workerId,
          label: worker(o.workerId)?.name ?? "",
          color: colorOf(o.workerId),
          solid: false,
        })),
    ),
  ];
  const total = round2(rows.reduce((sum, r) => sum + laborEntryAmount(Number(r.days) || 0, Number(r.rate) || 0), 0));

  return (
    <div className="flex flex-col gap-4">
      {rows.map((row, i) => {
        const isActive = row.key === active.key;
        const alreadyPaid = sharedDates(row.dates, otherDatesOf(row.workerId));
        return (
          <fieldset
            key={row.key}
            onFocusCapture={() => setActiveKey(row.key)}
            className={clsx(
              "flex flex-col gap-3 rounded-xl border p-3",
              rows.length > 1 && isActive ? "border-primary bg-surface-alt" : "border-border",
            )}
          >
            <input type="hidden" name="workDates" value={row.dates.join(",")} />
            <div className="flex items-end gap-2">
              <span
                className="mb-3.5 h-3 w-3 shrink-0 rounded-full"
                style={{ background: colorOf(row.workerId) }}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <Field label={i === 0 ? "Worker" : `Worker ${i + 1}`}>
                  <Select
                    name="workerId"
                    required
                    value={row.workerId}
                    onChange={(e) => chooseWorker(row.key, e.target.value)}
                  >
                    <option value="" disabled>
                      Choose…
                    </option>
                    {workers
                      .filter((w) => w.id === row.workerId || !chosen.has(w.id))
                      .map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))}
                  </Select>
                </Field>
              </div>
              {rows.length > 1 ? (
                <button
                  type="button"
                  onClick={() => removeRow(row.key)}
                  className="mb-1 rounded-full p-2 text-text-secondary hover:text-negative"
                  aria-label={`Remove ${worker(row.workerId)?.name ?? "worker"}`}
                >
                  <X size={18} />
                </button>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Days worked">
                <TextInput
                  type="number"
                  name="daysWorked"
                  min="0.5"
                  step="0.5"
                  inputMode="decimal"
                  value={row.days}
                  onChange={(e) => update(row.key, () => ({ days: e.target.value, daysTouched: true }))}
                  required
                />
              </Field>
              <Field label="Daily rate">
                <TextInput
                  type="number"
                  name="dailyRate"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={row.rate}
                  onChange={(e) => update(row.key, () => ({ rate: e.target.value }))}
                  required
                />
              </Field>
            </div>

            <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-xs text-text-secondary">
              <span>
                {row.dates.length === 0
                  ? "No days picked on the calendar"
                  : `${row.dates.length} day${row.dates.length === 1 ? "" : "s"} picked`}
                {row.daysTouched && row.dates.length > 0 && Number(row.days) !== row.dates.length ? (
                  <button
                    type="button"
                    className="ml-2 font-medium text-primary"
                    onClick={() => update(row.key, (r) => ({ days: String(r.dates.length), daysTouched: false }))}
                  >
                    Use {row.dates.length}
                  </button>
                ) : null}
              </span>
              {rows.length > 1 ? (
                <span>
                  Subtotal{" "}
                  <span className="font-semibold text-text-primary">
                    {formatMoney(laborEntryAmount(Number(row.days) || 0, Number(row.rate) || 0))}
                  </span>
                </span>
              ) : null}
            </div>
            {alreadyPaid.length > 0 ? (
              <p className="text-xs font-medium text-warning">
                Already in another labour entry: {alreadyPaid.map(formatDate).join(", ")}
              </p>
            ) : null}
          </fieldset>
        );
      })}

      {multiple && rows.length < workers.length ? (
        <button
          type="button"
          onClick={addRow}
          className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-border px-4 py-2.5 text-sm font-medium text-primary"
        >
          <Plus size={16} /> Add another worker
        </button>
      ) : null}

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-text-secondary">Work calendar</span>
        {rows.length > 1 ? (
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Pick days for">
            {rows.map((row) => (
              <button
                key={row.key}
                type="button"
                role="radio"
                aria-checked={row.key === active.key}
                onClick={() => setActiveKey(row.key)}
                className={clsx(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium",
                  row.key === active.key ? "text-white" : "border-border bg-surface text-text-primary",
                )}
                style={
                  row.key === active.key
                    ? { background: colorOf(row.workerId), borderColor: colorOf(row.workerId) }
                    : undefined
                }
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: row.key === active.key ? "#fff" : colorOf(row.workerId) }}
                />
                {worker(row.workerId)?.name ?? "Choose a worker"}
              </button>
            ))}
          </div>
        ) : null}
        <p className="text-xs text-text-secondary">
          {active.workerId
            ? `Tap the days ${worker(active.workerId)?.name} worked; tap again to remove. Drag (or press and drag on a phone) to pick several.`
            : "Choose a worker, then tap the days they worked."}
          {otherWorkDays.length > 0 ? " Outlined names are days already recorded in other entries." : ""}
        </p>
        <WorkCalendar marks={marks} onPickDates={pickDates} initialDate={entry?.workDates[0]} />
      </div>

      <p className="text-sm text-text-secondary">
        Total: <span className="font-semibold text-text-primary">{formatMoney(total)}</span>
      </p>
    </div>
  );
}
