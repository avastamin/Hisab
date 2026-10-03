"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { laborEntryAmount, saleEntryAmount } from "@/domain/money";
import { safeReturnTo } from "@/lib/returnTo";

function getTagIds(formData: FormData): string[] {
  return formData.getAll("tagIds").map(String).filter(Boolean);
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Picking the Labour category on the expense form adds a worker, which makes it a labour entry.
  const { error } = hasWorker(formData)
    ? await supabase.from("labor_entries").insert({ user_id: user.id, ...laborRow(formData) })
    : await supabase.from("expense_entries").insert({ user_id: user.id, ...expenseRow(formData) });
  if (error) throw new Error(error.message);

  revalidatePath("/", "layout");
  redirect(safeReturnTo(formData.get("returnTo")));
}

export async function addLabor(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("labor_entries").insert({ user_id: user.id, ...laborRow(formData) });
  if (error) throw new Error(error.message);

  revalidatePath("/", "layout");
  redirect(safeReturnTo(formData.get("returnTo")));
}

export async function addSale(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("sale_entries").insert({ user_id: user.id, ...saleRow(formData) });
  if (error) throw new Error(error.message);

  revalidatePath("/", "layout");
  redirect(safeReturnTo(formData.get("returnTo")));
}

const ENTRY_TABLES = {
  expense: "expense_entries",
  labor: "labor_entries",
  sale: "sale_entries",
} as const;

type EntryKind = keyof typeof ENTRY_TABLES;

const ENTRY_ROWS: Record<EntryKind, (formData: FormData) => Record<string, unknown>> = {
  expense: expenseRow,
  labor: laborRow,
  sale: saleRow,
};

// RLS limits update/delete to the signed-in user's own rows, so an id belonging to someone else matches nothing.
async function updateEntry(kind: EntryKind, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = String(formData.get("id"));
  const { error } = await supabase.from(ENTRY_TABLES[kind]).update(ENTRY_ROWS[kind](formData)).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/", "layout");
  redirect(safeReturnTo(formData.get("returnTo")));
}

async function deleteEntry(kind: EntryKind, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = String(formData.get("id"));
  const { error } = await supabase.from(ENTRY_TABLES[kind]).delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/", "layout");
  redirect(safeReturnTo(formData.get("returnTo")));
}

export async function updateExpense(formData: FormData) {
  if (!hasWorker(formData)) return updateEntry("expense", formData);

  // A worker was added to a Labour expense: move it to labor_entries. Insert first, so a failed delete can only
  // leave a duplicate to remove by hand, never lose the entry.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error: insertError } = await supabase.from("labor_entries").insert({ user_id: user.id, ...laborRow(formData) });
  if (insertError) throw new Error(insertError.message);
  const { error: deleteError } = await supabase.from("expense_entries").delete().eq("id", String(formData.get("id")));
  if (deleteError) throw new Error(deleteError.message);

  revalidatePath("/", "layout");
  redirect(safeReturnTo(formData.get("returnTo")));
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

export async function addCropCycle(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: cycle, error } = await supabase
    .from("crop_cycles")
    .insert({ user_id: user.id, status: "planned", ...cropCycleRow(formData) })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  const { error: costCenterError } = await supabase.from("cost_centers").insert({
    user_id: user.id,
    type: "crop_cycle",
    crop_cycle_id: cycle.id,
    name: String(formData.get("label")),
  });
  if (costCenterError) throw new Error(costCenterError.message);

  revalidatePath("/");
  revalidatePath("/crop-cycles");
  redirect(`/crop-cycles/${cycle.id}`);
}

export async function updateCropCycleStatus(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  const closedDate = status === "closed" ? new Date().toISOString().slice(0, 10) : null;

  const { error } = await supabase.from("crop_cycles").update({ status, closed_date: closedDate }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath(`/crop-cycles/${id}`);
  revalidatePath("/crop-cycles");
  revalidatePath("/");
}

export async function addCrop(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const { data: crop, error } = await supabase.from("crops").insert({ user_id: user.id, name }).select("id").single();
  if (error) throw new Error(error.message);

  revalidatePath("/new-crop-cycle");
  // Pre-select the new crop in the cycle form below.
  redirect(`/new-crop-cycle?cropId=${crop.id}`);
}

export async function renameCrop(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const { error } = await supabase.from("crops").update({ name }).eq("id", String(formData.get("id")));
  if (error) throw new Error(error.message);

  revalidatePath("/", "layout");
}

/** Only offered for crops with no cycles (deleting a crop would cascade to its cycles and all their entries). */
export async function deleteCrop(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = String(formData.get("id"));
  const { count, error: countError } = await supabase
    .from("crop_cycles")
    .select("id", { count: "exact", head: true })
    .eq("crop_id", id);
  if (countError) throw new Error(countError.message);
  if (count) return;

  const { error } = await supabase.from("crops").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/", "layout");
}

function cropCycleRow(formData: FormData) {
  const expectedYieldRaw = String(formData.get("expectedYield") ?? "").trim();
  return {
    crop_id: String(formData.get("cropId")),
    label: String(formData.get("label")),
    plot_or_area: String(formData.get("plotOrArea") ?? "").trim() || null,
    start_date: String(formData.get("startDate")),
    planned_harvest_date: String(formData.get("plannedHarvestDate") ?? "").trim() || null,
    expected_yield: expectedYieldRaw ? Number(expectedYieldRaw) : null,
    yield_unit: String(formData.get("yieldUnit") ?? "").trim() || null,
  };
}

export async function updateCropCycle(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = String(formData.get("id"));
  const row = cropCycleRow(formData);
  const { error } = await supabase.from("crop_cycles").update(row).eq("id", id);
  if (error) throw new Error(error.message);

  // The cycle's cost center carries its label as its display name (e.g. in "What is this for?").
  const { error: costCenterError } = await supabase.from("cost_centers").update({ name: row.label }).eq("crop_cycle_id", id);
  if (costCenterError) throw new Error(costCenterError.message);

  revalidatePath("/", "layout");
  redirect(`/crop-cycles/${id}`);
}

/** Deletes the cycle and, through the database's cascades, its cost center, expenses, labour and sales. */
export async function deleteCropCycle(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("crop_cycles").delete().eq("id", String(formData.get("id")));
  if (error) throw new Error(error.message);

  revalidatePath("/", "layout");
  redirect("/crop-cycles");
}
