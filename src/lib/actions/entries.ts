"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { laborEntryAmount, saleEntryAmount } from "@/domain/money";
import { safeReturnTo } from "@/lib/returnTo";
import { flash } from "@/lib/flash";
import { friendlyDbError } from "@/lib/dbErrors";

function getTagIds(formData: FormData): string[] {
  return formData.getAll("tagIds").map(String).filter(Boolean);
}

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

/** Flashes a friendly error and returns true when a Supabase call failed, so callers can `if (await failed(...)) return;`. */
async function failed(error: { code?: string; message: string } | null, what: string): Promise<boolean> {
  if (!error) return false;
  await flash("error", friendlyDbError(error, what));
  return true;
}

/** Revalidates everything (totals show up on several pages) and goes back to where the form was opened from. */
function done(formData: FormData): never {
  revalidatePath("/", "layout");
  redirect(safeReturnTo(formData.get("returnTo")));
}

// Row payloads shared by the add and update actions. amount is recomputed server-side for labor and sales so it
// always matches days × rate / quantity × price.
function hasWorker(formData: FormData): boolean {
  return String(formData.get("workerId") ?? "") !== "";
}

function expenseRow(formData: FormData) {
  return {
    date: String(formData.get("date")),
    cost_center_id: String(formData.get("costCenterId")),
    category_id: String(formData.get("categoryId")),
    tag_ids: getTagIds(formData),
    amount: Number(formData.get("amount")),
    note: String(formData.get("note") ?? "").trim() || null,
  };
}

function laborRow(formData: FormData) {
  const daysWorked = Number(formData.get("daysWorked"));
  const dailyRate = Number(formData.get("dailyRate"));
  return {
    date: String(formData.get("date")),
    cost_center_id: String(formData.get("costCenterId")),
    category_id: String(formData.get("categoryId")),
    tag_ids: getTagIds(formData),
    worker_id: String(formData.get("workerId")),
    days_worked: daysWorked,
    daily_rate: dailyRate,
    amount: laborEntryAmount(daysWorked, dailyRate),
    note: String(formData.get("note") ?? "").trim() || null,
  };
}

function saleRow(formData: FormData) {
  const quantity = Number(formData.get("quantity"));
  const unitPrice = Number(formData.get("unitPrice"));
  return {
    date: String(formData.get("date")),
    crop_cycle_id: String(formData.get("cropCycleId")),
    category_id: String(formData.get("categoryId")),
    tag_ids: getTagIds(formData),
    buyer: String(formData.get("buyer") ?? "").trim() || null,
    quantity,
    unit: String(formData.get("unit")),
    unit_price: unitPrice,
    amount: saleEntryAmount(quantity, unitPrice),
    note: String(formData.get("note") ?? "").trim() || null,
  };
}

export async function addExpense(formData: FormData) {
  const { supabase, user } = await requireUser();

  // Picking the Labour tag on the expense form adds a worker, which makes it a labour entry.
  if (hasWorker(formData)) {
    const { error } = await supabase.from("labor_entries").insert({ user_id: user.id, ...laborRow(formData) });
    if (await failed(error, "save the labour entry")) return;
    await flash("success", "Labour entry saved");
  } else {
    const { error } = await supabase.from("expense_entries").insert({ user_id: user.id, ...expenseRow(formData) });
    if (await failed(error, "save the expense")) return;
    await flash("success", "Expense saved");
  }
  done(formData);
}

export async function addLabor(formData: FormData) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("labor_entries").insert({ user_id: user.id, ...laborRow(formData) });
  if (await failed(error, "save the labour entry")) return;
  await flash("success", "Labour entry saved");
  done(formData);
}

export async function addSale(formData: FormData) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("sale_entries").insert({ user_id: user.id, ...saleRow(formData) });
  if (await failed(error, "save the sale")) return;
  await flash("success", "Sale saved");
  done(formData);
}

const ENTRY_KINDS = {
  expense: { table: "expense_entries", row: expenseRow, label: "Expense" },
  labor: { table: "labor_entries", row: laborRow, label: "Labour entry" },
  sale: { table: "sale_entries", row: saleRow, label: "Sale" },
} as const;

type EntryKind = keyof typeof ENTRY_KINDS;

// RLS limits update/delete to the signed-in user's own rows, so an id belonging to someone else matches nothing.
async function updateEntry(kind: EntryKind, formData: FormData) {
  const { supabase } = await requireUser();
  const { table, row, label } = ENTRY_KINDS[kind];
  const { error } = await supabase.from(table).update(row(formData)).eq("id", String(formData.get("id")));
  if (await failed(error, `update the ${label.toLowerCase()}`)) return;
  await flash("success", `${label} updated`);
  done(formData);
}

async function deleteEntry(kind: EntryKind, formData: FormData) {
  const { supabase } = await requireUser();
  const { table, label } = ENTRY_KINDS[kind];
  const { error } = await supabase.from(table).delete().eq("id", String(formData.get("id")));
  if (await failed(error, `delete the ${label.toLowerCase()}`)) return;
  await flash("success", `${label} deleted`);
  done(formData);
}

export async function updateExpense(formData: FormData) {
  if (!hasWorker(formData)) return updateEntry("expense", formData);

  // A worker was added to a Labour expense: move it to labor_entries. Insert first, so a failed delete can only
  // leave a duplicate to remove by hand, never lose the entry.
  const { supabase, user } = await requireUser();
  const { error: insertError } = await supabase.from("labor_entries").insert({ user_id: user.id, ...laborRow(formData) });
  if (await failed(insertError, "save the labour entry")) return;
  const { error: deleteError } = await supabase.from("expense_entries").delete().eq("id", String(formData.get("id")));
  if (deleteError) {
    await flash("warning", "Saved as a labour entry, but the old expense couldn't be removed. Delete it by hand.");
    done(formData);
  }
  await flash("info", "Saved as a labour entry with its worker");
  done(formData);
}

export async function updateLabor(formData: FormData) {
  await updateEntry("labor", formData);
}

export async function updateSale(formData: FormData) {
  await updateEntry("sale", formData);
}

export async function deleteExpense(formData: FormData) {
  await deleteEntry("expense", formData);
}

export async function deleteLabor(formData: FormData) {
  await deleteEntry("labor", formData);
}

export async function deleteSale(formData: FormData) {
  await deleteEntry("sale", formData);
}

function cropCycleRow(formData: FormData) {
  const expectedYieldRaw = String(formData.get("expectedYield") ?? "").trim();
  return {
    crop_id: String(formData.get("cropId")),
    label: String(formData.get("label")).trim(),
    plot_or_area: String(formData.get("plotOrArea") ?? "").trim() || null,
    start_date: String(formData.get("startDate")),
    planned_harvest_date: String(formData.get("plannedHarvestDate") ?? "").trim() || null,
    expected_yield: expectedYieldRaw ? Number(expectedYieldRaw) : null,
    yield_unit: String(formData.get("yieldUnit") ?? "").trim() || null,
  };
}

export async function addCropCycle(formData: FormData) {
  const { supabase, user } = await requireUser();
  const row = cropCycleRow(formData);

  const { data: cycle, error } = await supabase
    .from("crop_cycles")
    .insert({ user_id: user.id, status: "planned", ...row })
    .select("id")
    .single();
  if (await failed(error, "create the crop cycle")) return;

  // Entries are booked against a cost center, so every cycle gets one carrying its label.
  const { error: costCenterError } = await supabase.from("cost_centers").insert({
    user_id: user.id,
    type: "crop_cycle",
    crop_cycle_id: cycle!.id,
    name: row.label,
  });
  if (costCenterError) {
    await supabase.from("crop_cycles").delete().eq("id", cycle!.id);
    await failed(costCenterError, "create the crop cycle");
    return;
  }

  await flash("success", `Crop cycle "${row.label}" created`);
  revalidatePath("/", "layout");
  redirect(`/crop-cycles/${cycle!.id}`);
}

const STATUS_LABEL: Record<string, string> = { planned: "Planned", growing: "Growing", harvested: "Harvested", closed: "Closed" };

export async function updateCropCycleStatus(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  const closedDate = status === "closed" ? new Date().toISOString().slice(0, 10) : null;

  const { error } = await supabase.from("crop_cycles").update({ status, closed_date: closedDate }).eq("id", id);
  if (await failed(error, "change the status")) return;

  await flash("info", `Status changed to ${STATUS_LABEL[status] ?? status}`);
  revalidatePath("/", "layout");
}

export async function updateCropCycle(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("id"));
  const row = cropCycleRow(formData);
  const { error } = await supabase.from("crop_cycles").update(row).eq("id", id);
  if (await failed(error, "save the crop cycle")) return;

  // The cycle's cost center carries its label as its display name (e.g. in "What is this for?").
  const { error: costCenterError } = await supabase.from("cost_centers").update({ name: row.label }).eq("crop_cycle_id", id);
  if (await failed(costCenterError, "rename the crop cycle everywhere")) return;

  await flash("success", "Crop cycle updated");
  revalidatePath("/", "layout");
  redirect(`/crop-cycles/${id}`);
}

/** Deletes the cycle and, through the database's cascades, its cost center, expenses, labour and sales. */
export async function deleteCropCycle(formData: FormData) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("crop_cycles").delete().eq("id", String(formData.get("id")));
  if (await failed(error, "delete the crop cycle")) return;

  await flash("success", "Crop cycle deleted");
  revalidatePath("/", "layout");
  redirect("/crop-cycles");
}

export async function addCrop(formData: FormData) {
  const { supabase, user } = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    await flash("warning", "Enter a crop name first");
    return;
  }

  // Adding a crop that already exists just selects it, rather than creating a near-duplicate.
  const { data: existing } = await supabase.from("crops").select("id, name").ilike("name", name).limit(1);
  if (existing?.length) {
    await flash("warning", `"${existing[0].name}" is already in your crop list, so it's selected below`);
    redirect(`/new-crop-cycle?cropId=${existing[0].id}`);
  }

  const { data: crop, error } = await supabase.from("crops").insert({ user_id: user.id, name }).select("id").single();
  if (await failed(error, `add "${name}"`)) return;

  await flash("success", `"${name}" added. Set up its crop cycle below.`);
  revalidatePath("/", "layout");
  redirect(`/new-crop-cycle?cropId=${crop!.id}`);
}

export async function renameCrop(formData: FormData) {
  const { supabase } = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    await flash("warning", "The crop name can't be empty");
    return;
  }

  const { error } = await supabase.from("crops").update({ name }).eq("id", String(formData.get("id")));
  if (await failed(error, "rename the crop")) return;

  await flash("success", `Renamed to "${name}"`);
  revalidatePath("/", "layout");
}

/** Only offered for crops with no cycles (deleting a crop would cascade to its cycles and all their entries). */
export async function deleteCrop(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("id"));
  const { count, error: countError } = await supabase
    .from("crop_cycles")
    .select("id", { count: "exact", head: true })
    .eq("crop_id", id);
  if (await failed(countError, "delete the crop")) return;
  if (count) {
    await flash("warning", "This crop still has crop cycles. Delete those first.");
    return;
  }

  const { error } = await supabase.from("crops").delete().eq("id", id);
  if (await failed(error, "delete the crop")) return;

  await flash("success", "Crop deleted");
  revalidatePath("/", "layout");
}
