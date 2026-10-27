"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { DatesSetArg, EventInput } from "@fullcalendar/core";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { datesInRange } from "@/lib/workDates";

/** One worker on one day. `solid` marks are the ones being edited / shown; the others are context, drawn faintly. */
export interface CalendarMark {
  date: string;
  workerId: string;
  label: string;
  color: string;
  solid: boolean;
  href?: string;
}

/**
 * Month calendar of worker days, built on FullCalendar. With `onPickDates`, tapping a day (or dragging across
 * several) picks it; without, tapping a mark that has an `href` opens it.
 */
export function WorkCalendar({
  marks,
  onPickDates,
  onMonthChange,
  initialDate,
}: {
  marks: CalendarMark[];
  /** Called with the tapped day, or every day of a dragged range (`range` true). */
  onPickDates?: (dates: string[], range: boolean) => void;
  /** The month on screen, as "YYYY-MM", whenever it changes. */
  onMonthChange?: (month: string) => void;
  initialDate?: string;
}) {
  const router = useRouter();
  const events: EventInput[] = marks.map((m) => ({
    id: `${m.workerId}-${m.date}-${m.solid ? "s" : "o"}`,
    title: m.label,
    start: m.date,
    allDay: true,
    backgroundColor: m.solid ? m.color : "transparent",
    borderColor: m.color,
    textColor: m.solid ? "#ffffff" : "var(--text-secondary)",
    classNames: m.solid ? [] : ["work-mark-faint"],
    extendedProps: { href: m.href, solid: m.solid ? 1 : 0 },
  }));

  return (
    <div className={clsx("work-calendar", onPickDates && "work-calendar-picker")}>
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        initialDate={initialDate}
        headerToolbar={{ left: "prev,next", center: "title", right: "today" }}
        height="auto"
        fixedWeekCount={false}
        dayMaxEvents={3}
        eventOrder="-solid,title"
        events={events}
        selectable={!!onPickDates}
        selectLongPressDelay={300}
        unselectAuto
        dateClick={onPickDates ? (arg) => onPickDates([arg.dateStr], false) : undefined}
        select={(arg) => {
          // A single tapped day also arrives here; dateClick already handled it.
          const days = datesInRange(arg.startStr, arg.endStr);
          if (onPickDates && days.length > 1) onPickDates(days, true);
          arg.view.calendar.unselect();
        }}
        eventClick={(arg) => {
          arg.jsEvent.preventDefault();
          if (onPickDates) onPickDates([arg.event.startStr], false);
          else if (arg.event.extendedProps.href) router.push(arg.event.extendedProps.href);
        }}
        datesSet={(arg: DatesSetArg) => {
          // currentStart is local midnight; toISOString() would shift it to the previous day east of UTC.
          const start = arg.view.currentStart;
          onMonthChange?.(`${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`);
        }}
      />
    </div>
  );
}
