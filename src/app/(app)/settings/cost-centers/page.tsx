import { getAppData } from "@/lib/data/queries";
import { addCostCenter, deleteCostCenter } from "@/lib/actions/settings";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { Field, TextInput, Select, SubmitButton } from "@/components/form/Field";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";

const TYPE_LABEL: Record<string, string> = { vehicle: "Vehicle", person: "Person", general: "Household", farm: "Farm" };

export default async function CostCentersPage() {
  const { costCenters, expenseEntries, laborEntries } = await getAppData();
  const entryCount = (id: string) =>
    expenseEntries.filter((e) => e.costCenterId === id).length + laborEntries.filter((e) => e.costCenterId === id).length;
  const nonCropCenters = costCenters.filter((c) => c.type !== "crop_cycle");

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Vehicles & Cost Centers" backHref="/settings" />

      <Card>
        <form action={addCostCenter} className="flex flex-col gap-3">
          <Field label="Name" hint={'e.g. "Honda 125", "Ayesha\'s schooling"'}>
            <TextInput type="text" name="name" required />
          </Field>
          <Field label="Type">
            <Select name="type" defaultValue="general">
              <option value="general">Household (general)</option>
              <option value="farm">Farm (general, not tied to a crop cycle)</option>
              <option value="vehicle">Vehicle</option>
              <option value="person">Person</option>
            </Select>
          </Field>
          <SubmitButton>Add</SubmitButton>
        </form>
      </Card>

      <div className="flex flex-col gap-2">
        {nonCropCenters.map((c) => (
          <Card key={c.id} className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-text-primary">{c.name}</p>
              <p className="text-xs text-text-secondary">
                {TYPE_LABEL[c.type]} · {entryCount(c.id)} entr{entryCount(c.id) === 1 ? "y" : "ies"}
              </p>
            </div>
            {/* Deleting a cost center also deletes every expense recorded against it, so say how many. */}
            <ConfirmDeleteButton
              action={deleteCostCenter}
              id={c.id}
              label="cost center"
              message={
                entryCount(c.id) > 0
                  ? `Delete "${c.name}" and its ${entryCount(c.id)} expense entries? This can't be undone.`
                  : `Delete "${c.name}"?`
              }
              compact
            />
          </Card>
        ))}
      </div>
    </div>
  );
}
