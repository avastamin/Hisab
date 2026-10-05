import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { monthTitle, shiftMonth } from "@/lib/format";

/** Previous / next month arrows around the month's name; links to `basePath?month=YYYY-MM`. */
export function MonthPicker({ month, basePath }: { month: string; basePath: string }) {
  return (
    <div className="flex items-center justify-between">
      <Link href={`${basePath}?month=${shiftMonth(month, -1)}`} aria-label="Previous month" className="rounded-full p-2 text-text-secondary">
        <ChevronLeft size={20} />
      </Link>
      <p className="font-semibold text-text-primary">{monthTitle(month)}</p>
      <Link href={`${basePath}?month=${shiftMonth(month, 1)}`} aria-label="Next month" className="rounded-full p-2 text-text-secondary">
        <ChevronRight size={20} />
      </Link>
    </div>
  );
}
