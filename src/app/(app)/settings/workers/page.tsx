import { getAppData } from "@/lib/data/queries";
import { addWorker, deleteWorker } from "@/lib/actions/settings";
import { formatMoney } from "@/lib/format";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { Field, TextInput, SubmitButton } from "@/components/form/Field";
import { Trash2 } from "lucide-react";

export default async function WorkersPage() {
  const { workers } = await getAppData();

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
            <form action={deleteWorker}>
              <input type="hidden" name="id" value={w.id} />
              <button type="submit" className="p-1 text-text-secondary">
                <Trash2 size={18} />
              </button>
            </form>
          </Card>
        ))}
      </div>
    </div>
  );
}
