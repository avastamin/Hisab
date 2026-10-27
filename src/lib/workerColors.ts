import type { Worker } from "@/domain/types";

/** Worker colours for calendars: distinct from each other, readable with white text in light and dark mode. */
export const WORKER_COLORS: { value: string; name: string }[] = [
  { value: "#2563eb", name: "Blue" },
  { value: "#ea580c", name: "Orange" },
  { value: "#7c3aed", name: "Violet" },
  { value: "#db2777", name: "Pink" },
  { value: "#0d9488", name: "Teal" },
  { value: "#b45309", name: "Brown" },
  { value: "#dc2626", name: "Red" },
  { value: "#4d7c0f", name: "Olive" },
  { value: "#0891b2", name: "Cyan" },
  { value: "#57534e", name: "Stone" },
];

const isHexColor = (value: string | undefined): value is string => !!value && /^#[0-9a-f]{6}$/i.test(value);

/** The worker's chosen colour, or one derived from their id so it stays the same between visits. */
export function workerColor(worker: Pick<Worker, "id" | "color">): string {
  if (isHexColor(worker.color)) return worker.color;
  let hash = 0;
  for (const ch of worker.id) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return WORKER_COLORS[hash % WORKER_COLORS.length].value;
}

/** A colour for a new worker: the first one nobody uses yet, so the first ten workers never share one. */
export function nextWorkerColor(workers: Pick<Worker, "id" | "color">[]): string {
  const used = new Set(workers.map(workerColor));
  return (WORKER_COLORS.find((c) => !used.has(c.value)) ?? WORKER_COLORS[workers.length % WORKER_COLORS.length]).value;
}

/** Only palette colours are accepted from forms. */
export function parseWorkerColor(value: unknown): string | null {
  return WORKER_COLORS.some((c) => c.value === value) ? (value as string) : null;
}
