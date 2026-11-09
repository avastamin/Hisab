"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import { deleteExpense, deleteLabor, deleteSale } from "@/lib/actions/entries";
import {
  CALENDAR_SECTIONS,
  dayTotals,
  formatMoneyShort,
  itemsBySection,
  type CalendarItem,
  type CalendarItemKind,
  type CalendarSection,
} from "@/lib/calendarItems";
import { formatMoney, today } from "@/lib/format";
import { CASUAL_COLOR, CASUAL_WORKER } from "@/lib/labour";
import { Modal } from "@/components/Modal";
import { PendingButton } from "@/components/form/PendingButton";
import { WorkCalendar, type CalendarMark } from "./WorkCalendar";

export interface CalendarWorker {
  id: string;
  name: string;
  color: string;
}

const DELETE: Record<CalendarItemKind, { action: (formData: FormData) => Promise<void>; label: string }> = {
  labor: { action: deleteLabor, label: "labour entry" },
  sale: { action: deleteSale, label: "sale" },
  expense: { action: deleteExpense, label: "expense" },
};

/** Days of `month` ("YYYY-MM") that have already happened: all of a past month, up to today in this one. */
function daysSoFar(month: string): number {
  const now = today();
  if (month > now.slice(0, 7)) return 0;
  if (month === now.slice(0, 7)) return Number(now.slice(8, 10));
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

const longDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });

const returnToFor = (date: string) => `/worker-calendar?date=${date}`;
const withReturn = (href: string, date: string) =>
  `${href}${href.includes("?") ? "&" : "?"}returnTo=${encodeURIComponent(returnToFor(date))}`;

/** Wide screens show the selected day beside the calendar; narrower ones open it in a modal instead. */
function useIsWide() {
  const [wide, setWide] = useState(true);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const sync = () => setWide(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  return wide;
}

// Everything recorded, on one month calendar: each worker's days in their own colour, and sales and expenses tinted
// by type. Tapping a day lists its entries by type, with buttons to add more on that day; tapping an entry opens
// its details, from where it can be edited or deleted. Types and workers can be hidden.
export function CalendarView({
  items,
  workers,
  initialDate,
}: {
  items: CalendarItem[];
  workers: CalendarWorker[];
  initialDate: string;
}) {
  const [selected, setSelected] = useState(initialDate);
  const [month, setMonth] = useState(initialDate.slice(0, 7));
  const [hiddenSections, setHiddenSections] = useState<Set<CalendarSection>>(new Set());
  const [hiddenWorkers, setHiddenWorkers] = useState<Set<string>>(new Set());
  const [dayModal, setDayModal] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const wide = useIsWide();

  const visible = items.filter(
    (i) => !hiddenSections.has(i.section) && !(i.workerKey && hiddenWorkers.has(i.workerKey)),
  );
  const onDay = (date: string) => visible.filter((i) => i.days.includes(date));
  // Gone after a delete (or hidden), which closes its modals.
  const detail = items.find((i) => i.id === detailId);

  function select(date: string) {
    setSelected(date);
    // Kept in the URL so coming back from an edit page shows the same day.
    window.history.replaceState(null, "", returnToFor(date));
  }

  function changeMonth(next: string) {
    setMonth(next);
    if (!selected.startsWith(next)) select(today().startsWith(next) ? today() : `${next}-01`);
  }

  function openDetail(id: string) {
    setDetailId(id);
    setConfirmingDelete(false);
  }

  const order = (section: CalendarSection) => CALENDAR_SECTIONS.findIndex((s) => s.id === section);
  const marks: CalendarMark[] = visible.flatMap((item) =>
    item.days.map((date) => ({
      date,
      workerId: item.workerKey ?? item.kind,
      id: `${item.id}-${date}`,
      ref: item.id,
      label: item.label,
      color: item.color,
      solid: true,
      tinted: item.kind !== "labor",
      order: order(item.section),
    })),
  );

  const toggle = <T,>(set: (fn: (current: Set<T>) => Set<T>) => void, id: T) =>
    set((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-3 shadow-sm sm:p-4">
        <WorkCalendar
          marks={marks}
          initialDate={initialDate}
          selectedDate={selected}
          onMonthChange={changeMonth}
          onDayClick={(date) => {
            select(date);
            if (!wide) setDayModal(date);
          }}
          onMarkClick={({ ref, date }) => {
            select(date);
            if (ref) openDetail(ref);
          }}
          onMoreClick={(date) => {
            select(date);
            setDayModal(date);
          }}
        />
        <div className="flex flex-wrap gap-2" aria-label="Show on the calendar">
          {CALENDAR_SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => toggle(setHiddenSections, s.id)}
              aria-pressed={!hiddenSections.has(s.id)}
              className={clsx(
                "flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs font-medium text-text-primary",
                hiddenSections.has(s.id) && "opacity-50",
              )}
            >
              <span
                className="h-2.5 w-2.5 rounded-full border-2"
                style={{ borderColor: s.color, background: hiddenSections.has(s.id) ? "transparent" : s.color }}
                aria-hidden
              />
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {wide ? (
          <section className="rounded-2xl border border-border bg-surface p-4 shadow-sm" aria-label="Selected day">
            <DayHeading date={selected} items={onDay(selected)} />
            <DayEntries date={selected} items={onDay(selected)} onOpen={openDetail} />
          </section>
        ) : null}

        <WorkerSummary
          workers={workers}
          items={items}
          month={month}
          hidden={hiddenWorkers}
          onToggle={(id) => toggle(setHiddenWorkers, id)}
        />
      </div>

      <Modal
        open={dayModal !== null}
        onClose={() => setDayModal(null)}
        title={dayModal ? longDate(dayModal) : ""}
        subtitle={dayModal ? <DayTotals items={onDay(dayModal)} /> : null}
      >
        {dayModal ? <DayEntries date={dayModal} items={onDay(dayModal)} onOpen={openDetail} /> : null}
      </Modal>

      <Modal
        open={!!detail && !confirmingDelete}
        onClose={() => setDetailId(null)}
        title={detail?.title ?? ""}
        subtitle={detail ? CALENDAR_SECTIONS.find((s) => s.id === detail.section)?.label : null}
        footer={
          detail ? (
            <>
              <Link
                href={withReturn(detail.editHref, selected)}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-text"
              >
                <Pencil size={16} /> Edit
              </Link>
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-negative px-4 py-2.5 text-sm font-semibold text-negative hover:bg-negative/10"
              >
                <Trash2 size={16} /> Delete
              </button>
            </>
          ) : null
        }
      >
        {detail ? <EntryDetails item={detail} /> : null}
      </Modal>

      <Modal
        open={!!detail && confirmingDelete}
        onClose={() => setConfirmingDelete(false)}
        title={detail ? `Delete this ${DELETE[detail.kind].label}?` : ""}
        footer={
          detail ? (
            <>
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-text-primary hover:bg-surface-alt"
              >
                Cancel
              </button>
              <form action={DELETE[detail.kind].action} className="flex flex-1">
                <input type="hidden" name="id" value={detail.entryId} />
                <input type="hidden" name="returnTo" value={returnToFor(selected)} />
                <PendingButton className="flex-1 rounded-lg bg-negative px-4 py-2.5 text-sm font-semibold text-white hover:brightness-110">
                  Delete
                </PendingButton>
              </form>
            </>
          ) : null
        }
      >
        {detail ? (
          <p className="text-sm text-text-secondary">
            <span className="font-medium text-text-primary">{detail.title}</span> ·{" "}
            {formatMoney(detail.amount)} will be removed{detail.days.length > 1 ? ` from all ${detail.days.length} days` : ""}.
            This can&apos;t be undone.
          </p>
        ) : null}
      </Modal>
    </div>
  );
}

function DayTotals({ items }: { items: CalendarItem[] }) {
  const { spent, earned } = dayTotals(items);
  if (items.length === 0) return <>Nothing recorded</>;
  return (
    <>
      {spent > 0 ? <span className="font-semibold text-negative">−{formatMoneyShort(spent)}</span> : null}
      {spent > 0 && earned > 0 ? " · " : null}
      {earned > 0 ? <span className="font-semibold text-positive">+{formatMoneyShort(earned)}</span> : null}
    </>
  );
}

function DayHeading({ date, items }: { date: string; items: CalendarItem[] }) {
  return (
    <div className="mb-3">
      <h2 className="text-base font-semibold text-text-primary">{longDate(date)}</h2>
      <p className="text-xs text-text-secondary">
        <DayTotals items={items} />
      </p>
    </div>
  );
}

/** A day's entries, by type, plus buttons to add more on that day. */
function DayEntries({ date, items, onOpen }: { date: string; items: CalendarItem[]; onOpen: (id: string) => void }) {
  const adds = [
    { label: "Labour", href: `/add-labor?date=${date}` },
    { label: "Sale", href: `/add-sale?date=${date}` },
    { label: "Farm expense", href: `/add-expense?date=${date}&group=agro` },
    { label: "Family expense", href: `/add-expense?date=${date}&group=household` },
  ];

  return (
    <div className="flex flex-col gap-4">
      {items.length === 0 ? <p className="text-sm text-text-secondary">Nothing recorded on this day.</p> : null}

      {itemsBySection(items).map((section) => (
        <div key={section.id}>
          <h3 className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-secondary">
            <span className="h-2 w-2 rounded-full" style={{ background: section.color }} aria-hidden />
            {section.label} <span className="font-normal">({section.items.length})</span>
          </h3>
          <ul className="divide-y divide-border">
            {section.items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onOpen(item.id)}
                  className="flex w-full items-center gap-2.5 py-2 text-left"
                >
                  <span className="h-8 w-1 shrink-0 rounded-full" style={{ background: item.color }} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-text-primary">{item.title}</span>
                    {item.subtitle ? (
                      <span className="block truncate text-xs text-text-secondary">{item.subtitle}</span>
                    ) : null}
                  </span>
                  <span className={clsx("shrink-0 text-sm font-semibold", item.isRevenue ? "text-positive" : "text-negative")}>
                    {item.isRevenue ? "+" : "−"}
                    {formatMoneyShort(item.dayAmount)}
                  </span>
                  <ChevronRight size={16} className="shrink-0 text-text-secondary" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">Add on this day</h3>
        <div className="grid grid-cols-2 gap-2">
          {adds.map((a) => (
            <Link
              key={a.label}
              href={withReturn(a.href, date)}
              className="flex items-center justify-center gap-1 whitespace-nowrap rounded-lg border border-border px-1.5 py-2 text-[13px] font-medium text-text-primary hover:bg-surface-alt"
            >
              <Plus size={14} className="text-primary" /> {a.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function EntryDetails({ item }: { item: CalendarItem }) {
  return (
    <div className="flex flex-col gap-3">
      <p className={clsx("text-2xl font-bold", item.isRevenue ? "text-positive" : "text-negative")}>
        {item.isRevenue ? "+" : "−"}
        {formatMoney(item.amount)}
      </p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        {item.details.map((d) => (
          <div key={d.label} className="contents">
            <dt className="text-text-secondary">{d.label}</dt>
            <dd className="break-words text-text-primary">{d.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** Worked and not-worked days per worker in the month on screen; tapping one shows or hides them. */
function WorkerSummary({
  workers,
  items,
  month,
  hidden,
  onToggle,
}: {
  workers: CalendarWorker[];
  items: CalendarItem[];
  month: string;
  hidden: Set<string>;
  onToggle: (id: string) => void;
}) {
  const elapsed = daysSoFar(month);
  const workDays = (key: string) =>
    items
      .filter((i) => i.workerKey === key && i.hasWorkDates)
      .flatMap((i) => i.days.filter((d) => d.startsWith(month)));

  const rows = workers.map((w) => {
    const days = new Set(workDays(w.id));
    const workedSoFar = [...days].filter((d) => Number(d.slice(8, 10)) <= elapsed).length;
    return { ...w, worked: days.size, notWorked: Math.max(elapsed - workedSoFar, 0) as number | null };
  });
  // Casual workers are counted together, in worker-days (three helpers on one day is three).
  const casualDays = workDays(CASUAL_WORKER).length;
  if (casualDays > 0) rows.push({ id: CASUAL_WORKER, name: "Casual workers", color: CASUAL_COLOR, worked: casualDays, notWorked: null });

  if (rows.length === 0) return null;

  return (
    <section className="rounded-2xl border border-border bg-surface p-4 shadow-sm" aria-label="Workers this month">
      <h2 className="text-base font-semibold text-text-primary">Workers this month</h2>
      <p className="mb-3 text-xs text-text-secondary">
        Tap a name to show or hide them. Not worked counts days so far without a recorded day.
      </p>
      <ul className="flex flex-col gap-2">
        {rows.map((w) => (
          <li key={w.id}>
            <button
              type="button"
              onClick={() => onToggle(w.id)}
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
                <span className="font-semibold text-text-primary">{w.worked}</span>{" "}
                {w.notWorked === null ? "worker-days" : "worked"}
                {w.notWorked !== null && elapsed > 0 ? (
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
    </section>
  );
}
