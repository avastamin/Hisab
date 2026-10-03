import { getAppData } from "@/lib/data/queries";
import { addCostCenter, deleteCostCenter } from "@/lib/actions/settings";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { Field, TextInput, Select, SubmitButton } from "@/components/form/Field";
import { Trash2 } from "lucide-react";

const TYPE_LABEL: Record<string, string> = { vehicle: "Vehicle", person: "Person", general: "Household", farm: "Farm" };

export default async function CostCentersPage() {
  const { costCenters } = await getAppData();
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
              <p className="text-xs text-text-secondary">{TYPE_LABEL[c.type]}</p>
            </div>
            <form action={deleteCostCenter}>
              <input type="hidden" name="id" value={c.id} />
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
