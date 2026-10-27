import type { ISODateString } from "@/domain/types";

// Helpers for the days a worker worked ("YYYY-MM-DD" strings, kept sorted and unique). Date arithmetic is done in
// UTC so a day never shifts with the browser's timezone.

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const normalize = (dates: Iterable<string>): ISODateString[] => [...new Set(dates)].filter((d) => ISO_DATE.test(d)).sort();

/** Adds the date, or removes it when it's already there. */
export function toggleDate(dates: ISODateString[], date: ISODateString): ISODateString[] {
  return dates.includes(date) ? dates.filter((d) => d !== date) : normalize([...dates, date]);
}

export function addDates(dates: ISODateString[], more: ISODateString[]): ISODateString[] {
  return normalize([...dates, ...more]);
}

/** Every day from `start` up to but not including `endExclusive`, the way FullCalendar reports a selection. */
export function datesInRange(start: ISODateString, endExclusive: ISODateString): ISODateString[] {
  const out: ISODateString[] = [];
  const day = new Date(`${start}T00:00:00Z`);
  const end = new Date(`${endExclusive}T00:00:00Z`);
  while (day < end && out.length < 366) {
    out.push(day.toISOString().slice(0, 10));
    day.setUTCDate(day.getUTCDate() + 1);
  }
  return out;
}

/** Work dates as submitted by the labour form: one comma-separated field per worker. */
export function parseWorkDates(value: unknown): ISODateString[] {
  return typeof value === "string" ? normalize(value.split(",").map((d) => d.trim())) : [];
}

/** Dates found in both lists, e.g. days already paid for in another entry. */
export function sharedDates(a: ISODateString[], b: Iterable<ISODateString>): ISODateString[] {
  const other = new Set(b);
  return a.filter((d) => other.has(d));
}

/** The recorded days of labour entries (except the one being edited), slimmed down for the labour form's calendar. */
export function otherWorkDays(entries: { id: string; workerId: string; workDates: ISODateString[] }[], exceptId?: string) {
  return entries
    .filter((e) => e.id !== exceptId && e.workDates.length > 0)
    .map(({ workerId, workDates }) => ({ workerId, workDates }));
}
