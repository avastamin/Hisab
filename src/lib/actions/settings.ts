"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function updateBudgetSettings(formData: FormData) {
  const { supabase, user } = await requireUser();
  const enabled = formData.get("enabled") === "on";
  const monthlyAmount = Number(formData.get("monthlyAmount") || 0);

  const { error } = await supabase
    .from("budget_settings")
    .upsert({ user_id: user.id, enabled, monthly_amount: monthlyAmount }, { onConflict: "user_id" });
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/settings/budget");
}

export async function addCategory(formData: FormData) {
  const { supabase, user } = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const kind = String(formData.get("kind"));
  if (!name) return;

  const { error } = await supabase.from("categories").insert({ user_id: user.id, name, kind, is_built_in: false });
  if (error) throw new Error(error.message);
  revalidatePath("/settings/categories");
}

export async function deleteCategory(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("id"));
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings/categories");
}

export async function addTag(formData: FormData) {
  const { supabase, user } = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const { error } = await supabase.from("tags").insert({ user_id: user.id, name });
  if (error) throw new Error(error.message);
  revalidatePath("/settings/tags");
}

export async function deleteTag(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("id"));
  const { error } = await supabase.from("tags").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings/tags");
}

export async function addWorker(formData: FormData) {
  const { supabase, user } = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const rateRaw = String(formData.get("defaultDailyRate") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  const { error } = await supabase.from("workers").insert({
    user_id: user.id,
    name,
    default_daily_rate: rateRaw ? Number(rateRaw) : null,
    phone: phone || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/settings/workers");
}

export async function deleteWorker(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("id"));
  const { error } = await supabase.from("workers").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings/workers");
}

export async function addCostCenter(formData: FormData) {
  const { supabase, user } = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type"));
  if (!name) return;

  const { error } = await supabase.from("cost_centers").insert({ user_id: user.id, name, type });
  if (error) throw new Error(error.message);
  revalidatePath("/settings/cost-centers");
}

export async function deleteCostCenter(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("id"));
  const { error } = await supabase.from("cost_centers").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings/cost-centers");
}
