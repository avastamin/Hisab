"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { flash } from "@/lib/flash";
import { friendlyDbError } from "@/lib/dbErrors";
import { CATEGORY_GROUPS, categoryGroupLabel } from "@/domain/categoryGroups";
import type { CategoryGroup } from "@/domain/types";

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

function parseGroup(value: FormDataEntryValue | null): CategoryGroup | null {
  const group = String(value ?? "");
  return CATEGORY_GROUPS.some((g) => g.id === group) ? (group as CategoryGroup) : null;
}

export async function updateBudgetSettings(formData: FormData) {
  const { supabase, user } = await requireUser();
  const enabled = formData.get("enabled") === "on";
  const monthlyAmount = Number(formData.get("monthlyAmount") || 0);

  const { error } = await supabase
    .from("budget_settings")
    .upsert({ user_id: user.id, enabled, monthly_amount: monthlyAmount }, { onConflict: "user_id" });
  if (await failed(error, "save the budget")) return;

  await flash(enabled ? "success" : "info", enabled ? "Budget saved" : "Budget tracking turned off");
  revalidatePath("/");
  revalidatePath("/settings/budget");
}

/**
 * Adds a tag under a spending category (Agro / Household / Other), or a revenue category for sales. Stored in the
 * `categories` table; see domain/categoryGroups.ts.
 */
export async function addCategory(formData: FormData) {
  const { supabase, user } = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const kind = String(formData.get("kind")) === "revenue" ? "revenue" : "cost";
  const group = kind === "cost" ? parseGroup(formData.get("group")) : null;
  if (!name) {
    await flash("warning", "Enter a name first");
    return;
  }
  if (kind === "cost" && !group) {
    await flash("warning", "Choose Agro, Household or Other");
    return;
  }

  const { data: existing } = await supabase.from("categories").select("id").eq("kind", kind).ilike("name", name).limit(1);
  if (existing?.length) {
    await flash("warning", `"${name}" already exists`);
    return;
  }

  const { error } = await supabase
    .from("categories")
    .insert({ user_id: user.id, name, kind, category_group: group, is_built_in: false });
  if (await failed(error, `add "${name}"`)) return;

  await flash("success", group ? `Added "${name}" to ${categoryGroupLabel(group)}` : `Added "${name}"`);
  revalidatePath("/", "layout");
}

/** Renames a tag and/or moves it to another spending category. Entries keep pointing at it, so their history moves too. */
export async function updateCategory(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const group = parseGroup(formData.get("group"));
  if (!name) {
    await flash("warning", "The name can't be empty");
    return;
  }

  const { error } = await supabase
    .from("categories")
    .update(group ? { name, category_group: group } : { name })
    .eq("id", id);
  if (await failed(error, "save the change")) return;

  await flash("success", `Saved "${name}"`);
  revalidatePath("/", "layout");
}

export async function deleteCategory(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("id"));
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (await failed(error, "delete it")) return;

  await flash("success", "Deleted");
  revalidatePath("/", "layout");
}

export async function addTag(formData: FormData) {
  const { supabase, user } = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    await flash("warning", "Enter a label name first");
    return;
  }
  const { data: existing } = await supabase.from("tags").select("id").ilike("name", name).limit(1);
  if (existing?.length) {
    await flash("warning", `The label "${name}" already exists`);
    return;
  }

  const { error } = await supabase.from("tags").insert({ user_id: user.id, name });
  if (await failed(error, `add the label "${name}"`)) return;

  await flash("success", `Label "${name}" added`);
  revalidatePath("/", "layout");
}

export async function deleteTag(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("id"));
  const { error } = await supabase.from("tags").delete().eq("id", id);
  if (await failed(error, "delete the label")) return;

  await flash("success", "Label deleted");
  revalidatePath("/", "layout");
}

export async function addWorker(formData: FormData) {
  const { supabase, user } = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    await flash("warning", "Enter the worker's name first");
    return;
  }
  const rateRaw = String(formData.get("defaultDailyRate") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  const { error } = await supabase.from("workers").insert({
    user_id: user.id,
    name,
    default_daily_rate: rateRaw ? Number(rateRaw) : null,
    phone: phone || null,
  });
  if (await failed(error, `add ${name}`)) return;

  await flash("success", `${name} added`);
  revalidatePath("/", "layout");
}

export async function deleteWorker(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("id"));
  const { error } = await supabase.from("workers").delete().eq("id", id);
  if (await failed(error, "delete the worker")) return;

  await flash("success", "Worker deleted");
  revalidatePath("/", "layout");
}

export async function addCostCenter(formData: FormData) {
  const { supabase, user } = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type"));
  if (!name) {
    await flash("warning", "Enter a name first");
    return;
  }

  const { error } = await supabase.from("cost_centers").insert({ user_id: user.id, name, type });
  if (await failed(error, `add "${name}"`)) return;

  await flash("success", `"${name}" added`);
  revalidatePath("/", "layout");
}

export async function deleteCostCenter(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("id"));
  const { error } = await supabase.from("cost_centers").delete().eq("id", id);
  if (await failed(error, "delete it")) return;

  await flash("success", "Deleted");
  revalidatePath("/", "layout");
}
