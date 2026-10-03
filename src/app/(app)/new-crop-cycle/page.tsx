import { getAppData } from "@/lib/data/queries";
import { addCropCycle, addCrop } from "@/lib/actions/entries";
import { UNIT_OPTIONS } from "@/lib/unitOptions";
import { today } from "@/lib/format";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { Field, TextInput, Select, SubmitButton } from "@/components/form/Field";

export default async function NewCropCyclePage() {
  const { crops } = await getAppData();

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="New Crop Cycle" backHref="/crop-cycles" />

      <Card>
        <p className="mb-3 text-sm text-text-secondary">
          {crops.length === 0
            ? 'Add a crop first (e.g. "Tomato", "Rice").'
            : "Growing something new? Add it to your crop list."}
        </p>
        <form action={addCrop} className="flex gap-2">
          <TextInput type="text" name="name" placeholder="Crop name" required className="flex-1" />
          <button type="submit" className="rounded-lg bg-primary px-4 py-2.5 font-semibold text-primary-text">
            Add
          </button>
        </form>
      </Card>

      {crops.length > 0 ? (
        <Card>
          <form action={addCropCycle} className="flex flex-col gap-4">
            <Field label="Crop">
              <Select name="cropId" required defaultValue="">
                <option value="" disabled>
                  Choose…
                </option>
                {crops.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Label" hint='Freeform, e.g. "Winter 2026"'>
              <TextInput type="text" name="label" required />
            </Field>

            <Field label="Plot / area (optional)">
              <TextInput type="text" name="plotOrArea" />
            </Field>

            <Field label="Start date">
              <TextInput type="date" name="startDate" defaultValue={today()} required />
            </Field>

            <Field label="Planned harvest date (optional)">
              <TextInput type="date" name="plannedHarvestDate" />
            </Field>

            <div className="flex gap-3">
              <Field label="Expected yield (optional)">
                <TextInput type="number" name="expectedYield" min="0" step="0.01" inputMode="decimal" />
              </Field>
              <Field label="Yield unit">
                <Select name="yieldUnit" defaultValue="kg">
                  {UNIT_OPTIONS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <SubmitButton>Create Crop Cycle</SubmitButton>
          </form>
        </Card>
      ) : null}
    </div>
  );
}
