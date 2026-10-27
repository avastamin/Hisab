import type { CropCycle, LaborEntry, SaleEntry, Worker } from "@/domain/types";
import type { SelectOption } from "@/lib/costCenterOptions";
import { UNIT_OPTIONS } from "@/lib/unitOptions";
import { today } from "@/lib/format";
import { Field, TextInput, Select, TextArea, SubmitButton } from "@/components/form/Field";
import { ChooseSelect, HiddenFields, TagPicker, categoryOptions, groupedTagOptions, type CommonProps } from "./FormParts";
import { LiveTotal } from "./LiveTotal";
import { LabourFields, type OtherWorkDays } from "./LabourFields";
import { isLabourCategory } from "@/lib/labour";

// Labour and Sale forms, shared by the Add and Edit pages. When `entry` is given, the form is pre-filled and
// carries the entry's id (plus `returnTo`, where the update action redirects afterwards) as hidden fields.
// The expense form lives in ExpenseForm.tsx because it reacts to the chosen category.

export function LaborForm({
  action,
  categories,
  tags,
  submitLabel,
  returnTo,
  costOptions,
  workers,
  otherWorkDays,
  entry,
}: CommonProps & { costOptions: SelectOption[]; workers: Worker[]; otherWorkDays: OtherWorkDays[]; entry?: LaborEntry }) {
  return (
    <form action={action} className="flex flex-col gap-4">
      <HiddenFields id={entry?.id} returnTo={returnTo} />

      <Field label="Date" hint="When it was paid; it decides which month the cost counts in.">
        <TextInput type="date" name="date" defaultValue={entry?.date ?? today()} required />
      </Field>

      <Field label="What is this for?">
        <ChooseSelect name="costCenterId" defaultValue={entry?.costCenterId} options={costOptions} />
      </Field>

      <Field label="Tag">
        <ChooseSelect
          name="categoryId"
          defaultValue={entry?.categoryId ?? categories.find((c) => isLabourCategory(c))?.id}
          options={groupedTagOptions(categories)}
        />
      </Field>

      <TagPicker tags={tags} selected={entry?.tagIds} />

      {/* Editing one entry keeps it to one worker; a new entry can cover several, saved as one entry each. */}
      <LabourFields workers={workers} otherWorkDays={otherWorkDays} entry={entry} multiple={!entry} />

      <Field label="Note (optional)">
        <TextArea name="note" defaultValue={entry?.note} />
      </Field>

      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}

export function SaleForm({
  action,
  categories,
  tags,
  submitLabel,
  returnTo,
  cropCycles,
  entry,
  defaultCropCycleId,
}: CommonProps & { cropCycles: CropCycle[]; entry?: SaleEntry; defaultCropCycleId?: string }) {
  const defaultCycle = cropCycles.find((c) => c.id === (entry?.cropCycleId ?? defaultCropCycleId));
  return (
    <form action={action} className="flex flex-col gap-4">
      <HiddenFields id={entry?.id} returnTo={returnTo} />

      <Field label="Date">
        <TextInput type="date" name="date" defaultValue={entry?.date ?? today()} required />
      </Field>

      <Field label="Crop cycle">
        <ChooseSelect
          name="cropCycleId"
          defaultValue={defaultCycle?.id}
          options={cropCycles.map((c) => ({ id: c.id, label: c.label }))}
        />
      </Field>

      <Field label="Category">
        <ChooseSelect name="categoryId" defaultValue={entry?.categoryId} options={categoryOptions(categories)} />
      </Field>

      <TagPicker tags={tags} selected={entry?.tagIds} />

      <Field label="Buyer (optional)">
        <TextInput type="text" name="buyer" defaultValue={entry?.buyer} />
      </Field>

      <div className="flex gap-3">
        <Field label="Quantity">
          <TextInput type="number" name="quantity" min="0.01" step="0.01" inputMode="decimal" defaultValue={entry?.quantity} required />
        </Field>
        <Field label="Unit">
          <Select name="unit" required defaultValue={entry?.unit ?? defaultCycle?.yieldUnit ?? "kg"}>
            {UNIT_OPTIONS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Unit price">
        <TextInput type="number" name="unitPrice" min="0" step="0.01" inputMode="decimal" defaultValue={entry?.unitPrice} required />
      </Field>
      <LiveTotal a="quantity" b="unitPrice" />

      <Field label="Note (optional)">
        <TextArea name="note" defaultValue={entry?.note} />
      </Field>

      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}
