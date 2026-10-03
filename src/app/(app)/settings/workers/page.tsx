import { getAppData } from "@/lib/data/queries";
import { addWorker, deleteWorker } from "@/lib/actions/settings";
import { formatMoney } from "@/lib/format";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { Field, TextInput, SubmitButton } from "@/components/form/Field";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";

export default async function WorkersPage() {
  const { workers, laborEntries } = await getAppData();
  // The database won't delete a worker who has labour entries, so only offer it for workers who have none.
  const entryCount = (id: string) => laborEntries.filter((e) => e.workerId === id).length;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Workers" backHref="/settings" />

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
          <Card key={w.id} className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-text-primary">{w.name}</p>
              <p className="text-xs text-text-secondary">
                {w.defaultDailyRate ? `${formatMoney(w.defaultDailyRate)}/day` : "No default rate"}
                {w.phone ? ` · ${w.phone}` : ""}
              </p>
            </div>
            {entryCount(w.id) === 0 ? (
              <ConfirmDeleteButton action={deleteWorker} id={w.id} label="worker" message={`Delete ${w.name}?`} compact />
            ) : (
              <span className="text-xs text-text-secondary">
                {entryCount(w.id)} labour entr{entryCount(w.id) === 1 ? "y" : "ies"}
              </span>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
