"use client";

import { useState } from "react";
import type { ExpenseEntry, Worker } from "@/domain/types";
import type { SelectOption } from "@/lib/costCenterOptions";
import { formatMoney, today } from "@/lib/format";
import { isLabourCategory } from "@/lib/labour";
import { laborEntryAmount } from "@/domain/money";
import { Field, TextInput, TextArea, SubmitButton } from "@/components/form/Field";
import { ChooseSelect, HiddenFields, TagPicker, categoryOptions, type CommonProps } from "./FormParts";

// Client Component because picking the Labour category swaps the Amount field for Worker / Days / Daily rate.
// Submitted with a workerId, the add/update actions save it as a labour entry instead of a plain expense.
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
  const [categoryId, setCategoryId] = useState(entry?.categoryId ?? "");
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
        <ChooseSelect name="costCenterId" defaultValue={entry?.costCenterId ?? defaultCostCenterId} options={costOptions} />
      </Field>

      <Field label="Category">
        <ChooseSelect name="categoryId" defaultValue={categoryId} options={categoryOptions(categories)} onChange={setCategoryId} />
      </Field>

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
