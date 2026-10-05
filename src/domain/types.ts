/**
 * Core domain types for Hisab.
 *
 * Design note (from the product spec): everything is one ledger. An entry
 * (expense, labor, or sale) always points at a CostCenter, and a CostCenter
 * can represent a crop cycle, a vehicle, a person (e.g. a child's schooling),
 * "general" household spending with no specific target, or "farm" spending
 * that's agro-related but not yet tied to one specific crop cycle (e.g. bulk
 * fertilizer bought before it's allocated). Crops are just the first kind of
 * thing tracked this way, not a special case.
 *
 * Money note: amounts are stored as plain decimal numbers in the household's
 * single currency (BDT). All aggregation helpers round to 2 decimal places
 * to avoid floating-point drift. If multi-currency support is ever added,
 * amounts should move to integer minor units (poisha) first.
 */

export type ISODateString = string; // e.g. "2026-09-28"
export type ISODateTimeString = string; // e.g. "2026-09-28T10:15:00.000Z"

export type CostCenterType = "crop_cycle" | "vehicle" | "person" | "general" | "farm";

export type CropCycleStatus = "planned" | "growing" | "harvested" | "closed";

export type CategoryKind = "cost" | "revenue";

/** Top-level spending category. Each cost "category" row is really a tag under one of these (see domain/categoryGroups.ts). */
export type CategoryGroup = "agro" | "household" | "other";

export interface Crop {
  id: string;
  name: string;
  notes?: string;
  createdAt: ISODateTimeString;
}

export interface CropCycle {
  id: string;
  cropId: string;
  /** e.g. "Winter 2026" — freeform, so multiple plots of the same crop and season can each get their own cycle. */
  label: string;
  plotOrArea?: string;
  status: CropCycleStatus;
  startDate: ISODateString;
  plannedHarvestDate?: ISODateString;
  closedDate?: ISODateString;
  /** Optional expected/actual total yield, used to show remaining unsold stock against Sale Entries recorded in the same unit. */
  expectedYield?: number;
  yieldUnit?: string;
  createdAt: ISODateTimeString;
}

export interface Category {
  id: string;
  name: string;
  kind: CategoryKind;
  /** Which spending category this tag belongs to. Cost tags only; undefined for revenue categories. */
  group?: CategoryGroup;
  color?: string;
  isBuiltIn: boolean;
  createdAt: ISODateTimeString;
}

export interface Tag {
  id: string;
  name: string;
  createdAt: ISODateTimeString;
}

export interface CostCenter {
  id: string;
  type: CostCenterType;
  /** Set when type === "crop_cycle"; references CropCycle.id. */
  cropCycleId?: string;
  /** Display name — for vehicle/person/general centers this is user-entered (e.g. "Honda 125", "Ayesha's schooling"). */
  name: string;
  createdAt: ISODateTimeString;
}

export interface Worker {
  id: string;
  name: string;
  defaultDailyRate?: number;
  phone?: string;
  createdAt: ISODateTimeString;
}

interface EntryBase {
  id: string;
  date: ISODateString;
  costCenterId: string;
  categoryId: string;
  tagIds: string[];
  note?: string;
  createdAt: ISODateTimeString;
}

export interface ExpenseEntry extends EntryBase {
  kind: "expense";
  amount: number;
}

export interface LaborEntry extends EntryBase {
  kind: "labor";
  workerId: string;
  daysWorked: number;
  dailyRate: number;
  /** daysWorked * dailyRate, persisted so historical rate changes don't rewrite past totals. */
  amount: number;
}

export interface SaleEntry {
  id: string;
  date: ISODateString;
  cropCycleId: string;
  categoryId: string;
  tagIds: string[];
  buyer?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  /** quantity * unitPrice, persisted for the same reason as LaborEntry.amount. */
  amount: number;
  note?: string;
  createdAt: ISODateTimeString;
}

export type MoneyEntry = ExpenseEntry | LaborEntry;

/**
 * An optional, opt-in monthly spending goal against household spending (expense + labor
 * entries on non-crop-cycle cost centers — the same total already shown as "Household
 * spend (this month)" on Home). Deliberately not per-crop or per-category: this is a
 * single top-line goal, e.g. "I want to spend at most ৳50,000/month." Off by default —
 * most users never need to see it.
 */
export interface BudgetSettings {
  enabled: boolean;
  /** BDT. Only meaningful when enabled === true; stored even when disabled so turning it back on restores the last value. */
  monthlyAmount: number;
}

export interface AppSnapshot {
  schemaVersion: number;
  exportedAt: ISODateTimeString;
  crops: Crop[];
  cropCycles: CropCycle[];
  categories: Category[];
  tags: Tag[];
  costCenters: CostCenter[];
  workers: Worker[];
  expenseEntries: ExpenseEntry[];
  laborEntries: LaborEntry[];
  saleEntries: SaleEntry[];
  /** Optional for backward compatibility: a backup made before this feature existed simply omits it. */
  budgetSettings?: BudgetSettings;
}
