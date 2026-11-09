"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { DatesSetArg, EventInput, MoreLinkSimpleAction } from "@fullcalendar/core";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { datesInRange } from "@/lib/workDates";

/**
 * Something on one day: a worker's day, or (on the main calendar) a sale or expense. `solid` marks are the ones
 * being edited / shown; the others are context, drawn faintly. `tinted` marks get a light background in their colour
 * with normal text, so money entries look different from worker days.
 */
export interface CalendarMark {
  date: string;
  workerId: string;
  label: string;
  color: string;
  solid: boolean;
  tinted?: boolean;
  /** Unique per mark; defaults to worker + date, which is enough when each worker has one mark a day. */
  id?: string;
  /** Passed back to onMarkClick, e.g. the entry it stands for. */
  ref?: string;
  /** Lower sorts first within a day. */
  order?: number;
  href?: string;
}

const localDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/**
 * Month calendar built on FullCalendar. With `onPickDates`, tapping a day (or dragging across several) picks it.
 * Otherwise tapping a day calls `onDayClick`, tapping a mark calls `onMarkClick` (or opens its `href`), and the
 * "+N more" link calls `onMoreClick`.
 */
export function WorkCalendar({
  marks,
  onPickDates,
  onMonthChange,
  onDayClick,
  onMarkClick,
  onMoreClick,
  selectedDate,
  initialDate,
  maxMarks = 3,
}: {
  marks: CalendarMark[];
  /** Called with the tapped day, or every day of a dragged range (`range` true). */
  onPickDates?: (dates: string[], range: boolean) => void;
  /** The month on screen, as "YYYY-MM", whenever it changes. */
  onMonthChange?: (month: string) => void;
  onDayClick?: (date: string) => void;
  onMarkClick?: (mark: { ref?: string; date: string }) => void;
  onMoreClick?: (date: string) => void;
  /** Highlighted day. */
  selectedDate?: string;
  initialDate?: string;
  maxMarks?: number;
}) {
  const router = useRouter();
  const events: EventInput[] = marks.map((m) => ({
    id: m.id ?? `${m.workerId}-${m.date}-${m.solid ? "s" : "o"}`,
    title: m.label,
    start: m.date,
    allDay: true,
    backgroundColor: m.tinted
      ? `color-mix(in srgb, ${m.color} 18%, var(--surface))`
      : m.solid
        ? m.color
        : "transparent",
    borderColor: m.color,
    textColor: m.tinted ? "var(--text-primary)" : m.solid ? "#ffffff" : "var(--text-secondary)",
    classNames: [...(m.solid ? [] : ["work-mark-faint"]), ...(m.tinted ? ["work-mark-tinted"] : [])],
    extendedProps: { href: m.href, ref: m.ref, solid: m.solid ? 1 : 0, order: m.order ?? 0 },
  }));

  return (
    <div className={clsx("work-calendar", (onPickDates || onDayClick) && "work-calendar-picker")}>
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        // Saturday, the start of the working week in Bangladesh.
        firstDay={6}
        initialDate={initialDate}
        headerToolbar={{ left: "prev,next", center: "title", right: "today" }}
        height="auto"
        fixedWeekCount={false}
        dayMaxEvents={maxMarks}
        eventOrder="-solid,order,title"
        events={events}
        selectable={!!onPickDates}
        selectLongPressDelay={300}
        unselectAuto
        dayCellClassNames={(arg) => (selectedDate && localDate(arg.date) === selectedDate ? ["fc-day-picked"] : [])}
        dateClick={(arg) => {
          if (onPickDates) onPickDates([arg.dateStr], false);
          else onDayClick?.(arg.dateStr);
        }}
        select={(arg) => {
          // A single tapped day also arrives here; dateClick already handled it.
          const days = datesInRange(arg.startStr, arg.endStr);
          if (onPickDates && days.length > 1) onPickDates(days, true);
          arg.view.calendar.unselect();
        }}
        eventClick={(arg) => {
          arg.jsEvent.preventDefault();
          if (onPickDates) onPickDates([arg.event.startStr], false);
          else if (onMarkClick) onMarkClick({ ref: arg.event.extendedProps.ref, date: arg.event.startStr });
          else if (arg.event.extendedProps.href) router.push(arg.event.extendedProps.href);
        }}
        moreLinkClick={
          onMoreClick
            ? (arg) => {
                onMoreClick(localDate(arg.date));
                // A string would be taken as a view to zoom to; anything else that's truthy (and not "popover") makes
                // FullCalendar do nothing itself.
                return {} as unknown as MoreLinkSimpleAction;
              }
            : undefined
        }
        datesSet={(arg: DatesSetArg) => {
          // currentStart is local midnight; toISOString() would shift it to the previous day east of UTC.
          onMonthChange?.(localDate(arg.view.currentStart).slice(0, 7));
        }}
      />
    </div>
  );
}
