"use client";

import { useState } from "react";
import type { CategoryGroup, ExpenseEntry, Worker } from "@/domain/types";
import { CATEGORY_GROUPS } from "@/domain/categoryGroups";
import type { SelectOption } from "@/lib/costCenterOptions";
import { today } from "@/lib/format";
import { isLabourCategory } from "@/lib/labour";
import { Field, Select, TextInput, TextArea, SubmitButton } from "@/components/form/Field";
import { ChooseSelect, HiddenFields, TagPicker, type CommonProps } from "./FormParts";
import { LabourFields, type OtherWorkDays } from "./LabourFields";

// Client Component because the Tag list follows the chosen category (Agro / Household / Other), and picking the
// Labour tag swaps the Amount field for workers, their days on a calendar and daily rates. Submitted with a workerId, the add/update
// actions save it as a labour entry instead of a plain expense. The category itself isn't saved: it's implied by
// the tag.
export function ExpenseForm({
  action,
  categories,
  tags,
  submitLabel,
  returnTo,
  costOptions,
  workers,
  otherWorkDays,
  entry,
  defaultCostCenterId,
}: CommonProps & {
  costOptions: SelectOption[];
  workers: Worker[];
  otherWorkDays: OtherWorkDays[];
  entry?: ExpenseEntry;
  defaultCostCenterId?: string;
}) {
  const initialCostCenterId = entry?.costCenterId ?? defaultCostCenterId;
  const [categoryId, setCategoryId] = useState(entry?.categoryId ?? "");
  const [group, setGroup] = useState<CategoryGroup | "">(
    categories.find((c) => c.id === entry?.categoryId)?.group ??
      costOptions.find((o) => o.id === initialCostCenterId)?.group ??
      "",
  );
  // Once the category is picked by hand, choosing "What is this for?" no longer changes it.
  const [groupTouched, setGroupTouched] = useState(entry !== undefined);
  const tagsInGroup = categories.filter((c) => c.group === group);

  function chooseGroup(next: CategoryGroup | "") {
    setGroup(next);
    setGroupTouched(true);
    if (!categories.some((c) => c.id === categoryId && c.group === next)) setCategoryId("");
  }

  function chooseCostCenter(id: string) {
    const suggested = costOptions.find((o) => o.id === id)?.group;
    if (!groupTouched && suggested && suggested !== group) {
      setGroup(suggested);
      setCategoryId("");
    }
  }
  const isLabour = isLabourCategory(categories.find((c) => c.id === categoryId));
  const askForWorker = isLabour && workers.length > 0;

  return (
    <form action={action} className="flex flex-col gap-4">
      <HiddenFields id={entry?.id} returnTo={returnTo} />

      <Field label="Date">
        <TextInput type="date" name="date" defaultValue={entry?.date ?? today()} required />
      </Field>

      <Field label="What is this for?">
        <ChooseSelect name="costCenterId" defaultValue={initialCostCenterId} options={costOptions} onChange={chooseCostCenter} />
      </Field>

      <Field label="Category">
        <Select
          name="categoryGroup"
          required
          value={group}
          onChange={(e) => chooseGroup(e.target.value as CategoryGroup | "")}
        >
          <option value="" disabled>
            Choose…
          </option>
          {CATEGORY_GROUPS.map((g) => (
            <option key={g.id} value={g.id}>
              {g.label}
            </option>
          ))}
        </Select>
      </Field>

      {group ? (
        <Field label="Tag">
          <Select name="categoryId" required value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="" disabled>
              Choose…
            </option>
            {tagsInGroup.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}

      {isLabour && workers.length === 0 ? (
        <p className="-mt-2 text-xs text-text-secondary">
          Add workers in Settings → Workers to record who did the work.
        </p>
      ) : null}

      <TagPicker tags={tags} selected={entry?.tagIds} />

      {askForWorker ? (
        // An existing labour expense becomes 1 day at its old amount, so converting it doesn't change the total.
        <LabourFields
          workers={workers}
          otherWorkDays={otherWorkDays}
          initialRate={entry ? String(entry.amount) : undefined}
          multiple
        />
      ) : (
        <Field label="Amount">
          <TextInput
            type="number"
            name="amount"
            min="0.01"
            step="0.01"
            inputMode="decimal"
            placeholder="0.00"
            defaultValue={entry?.amount}
            required
          />
        </Field>
      )}

      <Field label="Note (optional)">
        <TextArea name="note" defaultValue={entry?.note} />
      </Field>

      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}
