import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { getAppData } from "@/lib/data/queries";
import { addWorker, deleteWorker, updateWorkerColor } from "@/lib/actions/settings";
import { formatMoney } from "@/lib/format";
import { WORKER_COLORS, workerColor } from "@/lib/workerColors";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { Field, TextInput, SubmitButton } from "@/components/form/Field";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";

export default async function WorkersPage() {
  const { workers, laborEntries } = await getAppData();
  // The database won't delete a worker who has labour entries, so only offer it for workers who have none.
  const entryCount = (id: string) => laborEntries.filter((e) => e.workerId === id).length;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <PageHeader title="Workers" backHref="/settings" />

      <Link
        href="/worker-calendar"
        className="flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-primary"
      >
        <CalendarDays size={18} /> See who worked when
      </Link>

      <Card>
        <form action={addWorker} className="flex flex-col gap-3">
          <Field label="Name">
            <TextInput type="text" name="name" required />
          </Field>
          <Field label="Default daily rate (optional)">
            <TextInput type="number" name="defaultDailyRate" min="0" step="0.01" inputMode="decimal" />
          </Field>
          <Field label="Phone (optional)">
            <TextInput type="tel" name="phone" />
          </Field>
          <SubmitButton>Add Worker</SubmitButton>
        </form>
      </Card>

      <div className="flex flex-col gap-2">
        {workers.map((w) => (
          <Card key={w.id} className="flex flex-col gap-3 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span
                  className="h-3.5 w-3.5 shrink-0 rounded-full"
                  style={{ background: workerColor(w) }}
                  aria-hidden
                />
                <div>
                  <p className="font-medium text-text-primary">{w.name}</p>
                  <p className="text-xs text-text-secondary">
                    {w.defaultDailyRate ? `${formatMoney(w.defaultDailyRate)}/day` : "No default rate"}
                    {w.phone ? ` · ${w.phone}` : ""}
                  </p>
                </div>
              </div>
              {entryCount(w.id) === 0 ? (
                <ConfirmDeleteButton
                  action={deleteWorker}
                  id={w.id}
                  label="worker"
                  message={`Delete ${w.name}?`}
                  compact
                />
              ) : (
                <span className="text-xs text-text-secondary">
                  {entryCount(w.id)} labour entr{entryCount(w.id) === 1 ? "y" : "ies"}
                </span>
              )}
            </div>
            {/* Each swatch submits its colour, so this works without any client-side code. */}
            <form
              action={updateWorkerColor}
              className="flex flex-wrap gap-1.5"
              aria-label={`Calendar colour for ${w.name}`}
            >
              <input type="hidden" name="id" value={w.id} />
              {WORKER_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="submit"
                  name="color"
                  value={c.value}
                  title={c.name}
                  aria-label={c.name}
                  aria-pressed={workerColor(w) === c.value}
                  className="h-6 w-6 rounded-full border-2 border-surface ring-offset-1 ring-offset-surface aria-pressed:ring-2 aria-pressed:ring-text-primary"
                  style={{ background: c.value }}
                />
              ))}
            </form>
          </Card>
        ))}
      </div>
    </div>
  );
}
