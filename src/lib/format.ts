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
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
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
  return new Date(year, m - 1, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
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
