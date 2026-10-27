"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { today } from "@/lib/format";
import { WorkCalendar, type CalendarMark } from "./WorkCalendar";

export interface CalendarWorker {
  id: string;
  name: string;
  color: string;
}

export interface CalendarEntry {
  id: string;
  workerId: string;
  workDates: string[];
}

/** Days of `month` ("YYYY-MM") that have already happened: all of a past month, up to today in this one. */
function daysSoFar(month: string): number {
  const now = today();
  if (month > now.slice(0, 7)) return 0;
  if (month === now.slice(0, 7)) return Number(now.slice(8, 10));
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

// Every worker's days on one calendar, each in their own colour. Workers can be hidden from the legend, and the
// summary counts each one's worked and not-worked days for the month on screen.
export function WorkerCalendarView({ workers, entries }: { workers: CalendarWorker[]; entries: CalendarEntry[] }) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [month, setMonth] = useState(today().slice(0, 7));

  const byId = new Map(workers.map((w) => [w.id, w]));
  const marks: CalendarMark[] = entries
    .filter((e) => !hidden.has(e.workerId) && byId.has(e.workerId))
    .flatMap((e) =>
      e.workDates.map((date) => ({
        date,
        workerId: e.workerId,
        label: byId.get(e.workerId)!.name,
        color: byId.get(e.workerId)!.color,
        solid: true,
        href: `/labor/${e.id}/edit?returnTo=${encodeURIComponent("/worker-calendar")}`,
      })),
    );

  const elapsed = daysSoFar(month);
  const summary = workers.map((w) => {
    const days = new Set(
      entries.filter((e) => e.workerId === w.id).flatMap((e) => e.workDates.filter((d) => d.startsWith(month))),
    );
    const workedSoFar = [...days].filter((d) => Number(d.slice(8, 10)) <= elapsed).length;
    return { ...w, worked: days.size, notWorked: Math.max(elapsed - workedSoFar, 0) };
  });

  function toggle(id: string) {
    setHidden((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="rounded-2xl border border-border bg-surface p-3 shadow-sm sm:p-4">
        <WorkCalendar marks={marks} onMonthChange={setMonth} />
      </div>

      <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <h2 className="text-base font-semibold text-text-primary">This month</h2>
        <p className="mb-3 text-xs text-text-secondary">
          Tap a name to show or hide them. Not worked counts days so far without a recorded day.
        </p>
        <ul className="flex flex-col gap-2">
          {summary.map((w) => (
            <li key={w.id}>
              <button
                type="button"
                onClick={() => toggle(w.id)}
                aria-pressed={!hidden.has(w.id)}
                className={clsx(
                  "flex w-full items-center gap-2.5 rounded-lg border border-border px-3 py-2 text-left",
                  hidden.has(w.id) && "opacity-50",
                )}
              >
                <span
                  className="h-3 w-3 shrink-0 rounded-full border-2"
                  style={{ borderColor: w.color, background: hidden.has(w.id) ? "transparent" : w.color }}
                  aria-hidden
                />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-text-primary">{w.name}</span>
                <span className="text-right text-xs text-text-secondary">
                  <span className="font-semibold text-text-primary">{w.worked}</span> worked
                  {elapsed > 0 ? (
                    <>
                      {" · "}
                      <span className="font-semibold text-text-primary">{w.notWorked}</span> not
                    </>
                  ) : null}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <Link
          href="/add-labor?returnTo=%2Fworker-calendar"
          className="mt-4 block rounded-lg bg-primary px-4 py-2.5 text-center text-sm font-semibold text-primary-text"
        >
          Add Labour
        </Link>
      </div>
    </div>
  );
}
