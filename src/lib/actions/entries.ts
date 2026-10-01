"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { laborEntryAmount, saleEntryAmount } from "@/domain/money";

function getTagIds(formData: FormData): string[] {
  return formData.getAll("tagIds").map(String).filter(Boolean);
}

export async function addExpense(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const amount = Number(formData.get("amount"));
  const { error } = await supabase.from("expense_entries").insert({
    user_id: user.id,
    date: String(formData.get("date")),
    cost_center_id: String(formData.get("costCenterId")),
    category_id: String(formData.get("categoryId")),
    tag_ids: getTagIds(formData),
    amount,
    note: String(formData.get("note") ?? "").trim() || null,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/");
  redirect("/");
}

export async function addLabor(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const daysWorked = Number(formData.get("daysWorked"));
  const dailyRate = Number(formData.get("dailyRate"));
  const { error } = await supabase.from("labor_entries").insert({
    user_id: user.id,
    date: String(formData.get("date")),
    cost_center_id: String(formData.get("costCenterId")),
    category_id: String(formData.get("categoryId")),
    tag_ids: getTagIds(formData),
    worker_id: String(formData.get("workerId")),
    days_worked: daysWorked,
    daily_rate: dailyRate,
    amount: laborEntryAmount(daysWorked, dailyRate),
    note: String(formData.get("note") ?? "").trim() || null,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/");
  redirect("/");
}

export async function addSale(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const quantity = Number(formData.get("quantity"));
  const unitPrice = Number(formData.get("unitPrice"));
  const { error } = await supabase.from("sale_entries").insert({
    user_id: user.id,
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
  });
  if (error) throw new Error(error.message);

  revalidatePath("/");
  redirect("/");
}

export async function addCropCycle(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const expectedYieldRaw = String(formData.get("expectedYield") ?? "").trim();

  const { data: cycle, error } = await supabase
    .from("crop_cycles")
    .insert({
      user_id: user.id,
      crop_id: String(formData.get("cropId")),
      label: String(formData.get("label")),
      plot_or_area: String(formData.get("plotOrArea") ?? "").trim() || null,
      status: "planned",
      start_date: String(formData.get("startDate")),
      planned_harvest_date: String(formData.get("plannedHarvestDate") ?? "").trim() || null,
      expected_yield: expectedYieldRaw ? Number(expectedYieldRaw) : null,
      yield_unit: String(formData.get("yieldUnit") ?? "").trim() || null,
    })
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

  const { error } = await supabase.from("crops").insert({ user_id: user.id, name });
  if (error) throw new Error(error.message);

  revalidatePath("/new-crop-cycle");
}
