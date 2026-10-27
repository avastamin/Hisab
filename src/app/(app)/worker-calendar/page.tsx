import Link from "next/link";
import { getAppData } from "@/lib/data/queries";
import { workerColor } from "@/lib/workerColors";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { WorkerCalendarView } from "@/components/calendar/WorkerCalendarView";

// Which days each worker worked (and didn't), from the days picked on labour entries.
export default async function WorkerCalendarPage() {
  const { workers, laborEntries } = await getAppData();
  const undated = laborEntries.filter((e) => e.workDates.length === 0).length;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Worker Calendar" />

      {workers.length === 0 ? (
        <Card>
          <p className="text-sm text-text-secondary">
            No workers yet. Add them in{" "}
            <Link href="/settings/workers" className="font-medium text-primary">
              Settings → Workers
            </Link>
            , then pick their days when you add labour.
          </p>
        </Card>
      ) : (
        <WorkerCalendarView
          workers={workers.map((w) => ({ id: w.id, name: w.name, color: workerColor(w) }))}
          entries={laborEntries.map(({ id, workerId, workDates }) => ({ id, workerId, workDates }))}
        />
      )}

      {undated > 0 ? (
        <p className="text-xs text-text-secondary">
          {undated} older labour entr{undated === 1 ? "y has" : "ies have"} no days picked, so{" "}
          {undated === 1 ? "it isn't" : "they aren't"} shown. Open one from All Entries to pick its days.
        </p>
      ) : null}
    </div>
  );
}
