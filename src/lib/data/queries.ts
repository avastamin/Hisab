import { createClient } from "@/lib/supabase/server";
import {
  mapBudgetSettings,
  mapCategory,
  mapCostCenter,
  mapCrop,
  mapCropCycle,
  mapExpenseEntry,
  mapLaborEntry,
  mapSaleEntry,
  mapTag,
  mapWorker,
} from "./mappers";
import type { BudgetSettings } from "@/domain/types";

/** Everything the Home dashboard / reports need, fetched in parallel. RLS scopes every query to the signed-in user. */
export async function getAppData() {
  const supabase = await createClient();

  const [crops, cropCycles, categories, tags, costCenters, workers, expenseEntries, laborEntries, saleEntries, budgetSettingsRow] =
    await Promise.all([
      supabase.from("crops").select("*").order("created_at"),
      supabase.from("crop_cycles").select("*").order("start_date", { ascending: false }),
      supabase.from("categories").select("*").order("name"),
      supabase.from("tags").select("*").order("name"),
      supabase.from("cost_centers").select("*").order("name"),
      supabase.from("workers").select("*").order("name"),
      supabase.from("expense_entries").select("*").order("date", { ascending: false }),
      supabase.from("labor_entries").select("*").order("date", { ascending: false }),
      supabase.from("sale_entries").select("*").order("date", { ascending: false }),
      supabase.from("budget_settings").select("*").maybeSingle(),
    ]);

  const firstError = [
    crops, cropCycles, categories, tags, costCenters, workers, expenseEntries, laborEntries, saleEntries, budgetSettingsRow,
  ].find((r) => r.error)?.error;
  if (firstError) throw new Error(firstError.message);

  const defaultBudget: BudgetSettings = { enabled: false, monthlyAmount: 0 };

  return {
    crops: (crops.data ?? []).map(mapCrop),
    cropCycles: (cropCycles.data ?? []).map(mapCropCycle),
    categories: (categories.data ?? []).map(mapCategory),
    tags: (tags.data ?? []).map(mapTag),
    costCenters: (costCenters.data ?? []).map(mapCostCenter),
    workers: (workers.data ?? []).map(mapWorker),
    expenseEntries: (expenseEntries.data ?? []).map(mapExpenseEntry),
    laborEntries: (laborEntries.data ?? []).map(mapLaborEntry),
    saleEntries: (saleEntries.data ?? []).map(mapSaleEntry),
    budgetSettings: budgetSettingsRow.data ? mapBudgetSettings(budgetSettingsRow.data) : defaultBudget,
  };
}

export type AppData = Awaited<ReturnType<typeof getAppData>>;
