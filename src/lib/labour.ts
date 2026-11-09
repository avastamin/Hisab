import type { Category, LaborEntry, Worker } from "@/domain/types";

/** The built-in labour category (spelt "Labor" before the rename, so both are matched). Picking it on the expense form asks for a worker. */
export function isLabourCategory(category: Pick<Category, "name"> | undefined): boolean {
  return !!category && /^labou?r$/i.test(category.name.trim());
}

/** The worker select's value for a casual worker: someone not saved in Settings → Workers, optionally given a name. */
export const CASUAL_WORKER = "casual";

/** Calendar colour shared by every casual worker. */
export const CASUAL_COLOR = "#475569";

/** Who did the work: the saved worker's name, else the casual worker's label, else "Casual worker". */
export function labourName(entry: Pick<LaborEntry, "workerId" | "workerLabel">, workers: Pick<Worker, "id" | "name">[]): string {
  if (entry.workerId) return workers.find((w) => w.id === entry.workerId)?.name ?? "Worker";
  return entry.workerLabel || "Casual worker";
}
