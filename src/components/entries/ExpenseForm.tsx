"use client";

import { useState } from "react";
import type { CategoryGroup, ExpenseEntry, Worker } from "@/domain/types";
import { CATEGORY_GROUPS } from "@/domain/categoryGroups";
import type { SelectOption } from "@/lib/costCenterOptions";
import { formatMoney, today } from "@/lib/format";
import { isLabourCategory } from "@/lib/labour";
import { laborEntryAmount } from "@/domain/money";
import { Field, Select, TextInput, TextArea, SubmitButton } from "@/components/form/Field";
import { ChooseSelect, HiddenFields, TagPicker, type CommonProps } from "./FormParts";

// Client Component because the Tag list follows the chosen category (Agro / Household / Other), and picking the
// Labour tag swaps the Amount field for Worker / Days / Daily rate. Submitted with a workerId, the add/update
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
  entry,
  defaultCostCenterId,
}: CommonProps & {
  costOptions: SelectOption[];
  workers: Worker[];
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
  const [workerId, setWorkerId] = useState("");
  const [daysWorked, setDaysWorked] = useState("1");
  // An existing labour expense becomes 1 day at its old amount, so converting it doesn't change the total.
  const [dailyRate, setDailyRate] = useState(entry ? String(entry.amount) : "");

  const isLabour = isLabourCategory(categories.find((c) => c.id === categoryId));
  const askForWorker = isLabour && workers.length > 0;
  const labourTotal = laborEntryAmount(Number(daysWorked) || 0, Number(dailyRate) || 0);

  function chooseWorker(id: string) {
    setWorkerId(id);
    const rate = workers.find((w) => w.id === id)?.defaultDailyRate;
    if (!dailyRate && rate !== undefined) setDailyRate(String(rate));
  }

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

      {askForWorker ? (
        <Field label="Worker">
          <ChooseSelect
            name="workerId"
            defaultValue={workerId}
            options={workers.map((w) => ({ id: w.id, label: w.name }))}
            onChange={chooseWorker}
          />
        </Field>
      ) : null}

      {isLabour && workers.length === 0 ? (
        <p className="-mt-2 text-xs text-text-secondary">
          Add workers in Settings → Workers to record who did the work.
        </p>
      ) : null}

      <TagPicker tags={tags} selected={entry?.tagIds} />

      {askForWorker ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Days worked">
              <TextInput
                type="number"
                name="daysWorked"
                min="0.5"
                step="0.5"
                inputMode="decimal"
                value={daysWorked}
                onChange={(e) => setDaysWorked(e.target.value)}
                required
              />
            </Field>
            <Field label="Daily rate">
              <TextInput
                type="number"
                name="dailyRate"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={dailyRate}
                onChange={(e) => setDailyRate(e.target.value)}
                required
              />
            </Field>
          </div>
          <p className="-mt-2 text-sm text-text-secondary">
            Total: <span className="font-semibold text-text-primary">{formatMoney(labourTotal)}</span>
          </p>
        </>
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
