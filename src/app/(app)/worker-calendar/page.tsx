import { getAppData } from "@/lib/data/queries";
import { buildCalendarItems } from "@/lib/calendarItems";
import { isoDateParam, today } from "@/lib/format";
import { workerColor } from "@/lib/workerColors";
import { PageHeader } from "@/components/PageHeader";
import { CalendarView } from "@/components/calendar/CalendarView";

// Everything recorded, by day: labour on the days worked, sales and expenses on their dates. ?date=YYYY-MM-DD
// picks the day shown (kept in the URL so returning from an edit lands on the same day).
export default async function CalendarPage({ searchParams }: PageProps<"/worker-calendar">) {
  const date = isoDateParam((await searchParams).date) ?? today();
  const data = await getAppData();

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Calendar" />
      <CalendarView
        items={buildCalendarItems(data)}
        workers={data.workers.map((w) => ({ id: w.id, name: w.name, color: workerColor(w) }))}
        initialDate={date}
      />
    </div>
  );
}
