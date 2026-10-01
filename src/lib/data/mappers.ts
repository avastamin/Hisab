// Maps snake_case Supabase rows to the camelCase domain types in src/domain/types.ts,
// the same split the mobile app keeps between src/db/mappers.ts and src/domain/types.ts.
import type {
  Category,
  CostCenter,
  Crop,
  CropCycle,
  ExpenseEntry,
  LaborEntry,
  SaleEntry,
  Tag,
  Worker,
  BudgetSettings,
} from "@/domain/types";

/* eslint-disable @typescript-eslint/no-explicit-any */

export const mapCrop = (r: any): Crop => ({ id: r.id, name: r.name, notes: r.notes ?? undefined, createdAt: r.created_at });

export const mapCropCycle = (r: any): CropCycle => ({
  id: r.id,
  cropId: r.crop_id,
  label: r.label,
  plotOrArea: r.plot_or_area ?? undefined,
  status: r.status,
  startDate: r.start_date,
  plannedHarvestDate: r.planned_harvest_date ?? undefined,
  closedDate: r.closed_date ?? undefined,
  expectedYield: r.expected_yield ?? undefined,
  yieldUnit: r.yield_unit ?? undefined,
  createdAt: r.created_at,
});

export const mapCategory = (r: any): Category => ({
  id: r.id,
  name: r.name,
  kind: r.kind,
  color: r.color ?? undefined,
  isBuiltIn: r.is_built_in,
  createdAt: r.created_at,
});

export const mapTag = (r: any): Tag => ({ id: r.id, name: r.name, createdAt: r.created_at });

export const mapCostCenter = (r: any): CostCenter => ({
  id: r.id,
  type: r.type,
  cropCycleId: r.crop_cycle_id ?? undefined,
  name: r.name,
  createdAt: r.created_at,
});

export const mapWorker = (r: any): Worker => ({
  id: r.id,
  name: r.name,
  defaultDailyRate: r.default_daily_rate ?? undefined,
  phone: r.phone ?? undefined,
  createdAt: r.created_at,
});

export const mapExpenseEntry = (r: any): ExpenseEntry => ({
  id: r.id,
  kind: "expense",
  date: r.date,
  costCenterId: r.cost_center_id,
  categoryId: r.category_id,
  tagIds: r.tag_ids ?? [],
  note: r.note ?? undefined,
  amount: Number(r.amount),
  createdAt: r.created_at,
});

export const mapLaborEntry = (r: any): LaborEntry => ({
  id: r.id,
  kind: "labor",
  date: r.date,
  costCenterId: r.cost_center_id,
  categoryId: r.category_id,
  tagIds: r.tag_ids ?? [],
  note: r.note ?? undefined,
  workerId: r.worker_id,
  daysWorked: Number(r.days_worked),
  dailyRate: Number(r.daily_rate),
  amount: Number(r.amount),
  createdAt: r.created_at,
});

export const mapSaleEntry = (r: any): SaleEntry => ({
  id: r.id,
  date: r.date,
  cropCycleId: r.crop_cycle_id,
  categoryId: r.category_id,
  tagIds: r.tag_ids ?? [],
  buyer: r.buyer ?? undefined,
  quantity: Number(r.quantity),
  unit: r.unit,
  unitPrice: Number(r.unit_price),
  amount: Number(r.amount),
  note: r.note ?? undefined,
  createdAt: r.created_at,
});

export const mapBudgetSettings = (r: any): BudgetSettings => ({
  enabled: r.enabled,
  monthlyAmount: Number(r.monthly_amount),
});
