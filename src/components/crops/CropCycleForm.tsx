import type { Crop, CropCycle } from "@/domain/types";
import { UNIT_OPTIONS } from "@/lib/unitOptions";
import { today } from "@/lib/format";
import { Field, TextInput, Select, SubmitButton } from "@/components/form/Field";

// Shared by New Crop Cycle and Edit Crop Cycle. Status isn't here: it's changed from the cycle's own page.
export function CropCycleForm({
  action,
  crops,
  cycle,
  defaultCropId,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<void>;
  crops: Crop[];
  cycle?: CropCycle;
  defaultCropId?: string;
  submitLabel: string;
}) {
  return (
    <form action={action} className="flex flex-col gap-4">
      {cycle ? <input type="hidden" name="id" value={cycle.id} /> : null}

      <Field label="Crop">
        <Select name="cropId" required defaultValue={cycle?.cropId ?? defaultCropId ?? ""}>
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
        <TextInput type="text" name="label" defaultValue={cycle?.label} required />
      </Field>

      <Field label="Plot / area (optional)">
        <TextInput type="text" name="plotOrArea" defaultValue={cycle?.plotOrArea} />
      </Field>

      <Field label="Start date">
        <TextInput type="date" name="startDate" defaultValue={cycle?.startDate ?? today()} required />
      </Field>

      <Field label="Planned harvest date (optional)">
        <TextInput type="date" name="plannedHarvestDate" defaultValue={cycle?.plannedHarvestDate} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Expected yield (optional)">
          <TextInput
            type="number"
            name="expectedYield"
            min="0"
            step="0.01"
            inputMode="decimal"
            defaultValue={cycle?.expectedYield}
          />
        </Field>
        <Field label="Yield unit">
          <Select name="yieldUnit" defaultValue={cycle?.yieldUnit ?? "kg"}>
            {UNIT_OPTIONS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}
