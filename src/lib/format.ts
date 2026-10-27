/**
 * One fixed locale for every date we print, so text rendered on the server matches what the browser renders
 * (different machines' default locales disagree, e.g. "Sep" vs "Sept", which breaks hydration).
 */
export const DATE_LOCALE = "en-US";

/** Formats a number as BDT currency, e.g. formatMoney(1234.5) -> "৳ 1,234.50". */
export function formatMoney(amount: number): string {
  const rounded = Math.round((amount + Number.EPSILON) * 100) / 100;
  const [whole, fraction = "00"] = Math.abs(rounded).toFixed(2).split(".");
  const withCommas = groupDigits(whole ?? "0");
  const sign = rounded < 0 ? "-" : "";
  return `৳ ${sign}${withCommas}.${fraction}`;
}

function groupDigits(digits: string): string {
  // South Asian digit grouping (lakh/crore): last 3 digits, then groups of 2.
  if (digits.length <= 3) return digits;
  const last3 = digits.slice(-3);
  const rest = digits.slice(0, -3);
  const grouped = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `${grouped},${last3}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(DATE_LOCALE, { day: "2-digit", month: "short", year: "numeric" });
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** The current calendar month as an inclusive date range, "YYYY-MM-01" through today. */
export function currentMonthRange(): { start: string; end: string } {
  const now = new Date();
  const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  return { start, end: today() };
}

/** "2026-10" shifted by `delta` months. */
export function shiftMonth(month: string, delta: number): string {
  const [year, m] = month.split("-").map(Number);
  const d = new Date(year, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function monthTitle(month: string): string {
  const [year, m] = month.split("-").map(Number);
  return new Date(year, m - 1, 1).toLocaleDateString(DATE_LOCALE, { month: "long", year: "numeric" });
}

/** A "YYYY-MM" from a URL search param, falling back to the current month. */
export function monthFromParam(value: unknown): string {
  return typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value) ? value : today().slice(0, 7);
}

/** The first and last day of a "YYYY-MM" month, as an inclusive date range. */
export function monthRange(month: string): { start: string; end: string } {
  const [year, m] = month.split("-").map(Number);
  const lastDay = new Date(year, m, 0).getDate();
  return { start: `${month}-01`, end: `${month}-${String(lastDay).padStart(2, "0")}` };
}

/** The last `count` months as "YYYY-MM", oldest first, ending with `endMonth` (default: this month). */
export function lastMonths(count: number, endMonth: string = today().slice(0, 7)): string[] {
  return Array.from({ length: count }, (_, i) => shiftMonth(endMonth, i - (count - 1)));
}

/** The preset periods the Home charts can cover, in months ending with this one. */
export const CHART_RANGES = [1, 3, 6, 12] as const;
export type ChartRange = (typeof CHART_RANGES)[number];

/** A chart range from a URL search param, falling back to 12 months. */
export function chartRangeFromParam(value: unknown): ChartRange {
  const n = typeof value === "string" ? Number(value) : NaN;
  return (CHART_RANGES as readonly number[]).includes(n) ? (n as ChartRange) : 12;
}

/** A real "YYYY-MM-DD" date (not e.g. 2026-02-31), or undefined. */
function isoDateParam(value: unknown): string | undefined {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value ? value : undefined;
}

/** Every "YYYY-MM" from `start` to `end`, inclusive. */
export function monthsBetween(start: string, end: string): string[] {
  const months: string[] = [];
  for (let m = start; m <= end && months.length < 600; m = shiftMonth(m, 1)) months.push(m);
  return months;
}

/** The longest custom period, so a typo like year 1026 can't build thousands of bars. */
const MAX_CUSTOM_MONTHS = 120;

export interface ChartPeriod {
  /** A preset number of months, or "custom" for picked start and end dates. */
  range: ChartRange | "custom";
  /** Inclusive dates the charts count entries between. */
  start: string;
  end: string;
  /** The months the cash flow chart shows, oldest first. */
  months: string[];
}

/**
 * The Home charts' period from the URL: ?range=1|3|6|12 (whole months ending with this one, default 12), or
 * ?range=custom&from=YYYY-MM-DD&to=YYYY-MM-DD. A custom range given backwards is swapped; missing dates default to
 * the last 12 months.
 */
export function chartPeriodFromParams(params: { range?: unknown; from?: unknown; to?: unknown }): ChartPeriod {
  if (params.range === "custom") {
    const fallback = lastMonths(12);
    let start = isoDateParam(params.from) ?? `${fallback[0]}-01`;
    let end = isoDateParam(params.to) ?? today();
    if (start > end) [start, end] = [end, start];
    let months = monthsBetween(start.slice(0, 7), end.slice(0, 7));
    if (months.length > MAX_CUSTOM_MONTHS) {
      months = months.slice(-MAX_CUSTOM_MONTHS);
      start = `${months[0]}-01`;
    }
    return { range: "custom", start, end, months };
  }
  const range = chartRangeFromParam(params.range);
  const months = lastMonths(range);
  return { range, start: `${months[0]}-01`, end: monthRange(months[months.length - 1]).end, months };
}

/** "Oct 1, 2026 – Oct 27, 2026"-style label for a custom period. */
export function dateSpan(start: string, end: string): string {
  return `${formatDate(start)} – ${formatDate(end)}`;
}

/** "Nov 2025 – Oct 2026" for a list of "YYYY-MM" months. */
export function monthSpan(months: readonly string[]): string {
  const short = (month: string) => {
    const [year, m] = month.split("-").map(Number);
    return new Date(year, m - 1, 1).toLocaleDateString(DATE_LOCALE, { month: "short", year: "numeric" });
  };
  return months.length === 0 ? "" : `${short(months[0])} – ${short(months[months.length - 1])}`;
}
