import type { CategoryGroup, CostCenter, CropCycle } from "@/domain/types";

const TYPE_LABEL: Record<Exclude<CostCenter["type"], "crop_cycle">, string> = {
  vehicle: "Vehicle",
  person: "Person",
  general: "Household",
  farm: "Farm",
};

export interface SelectOption {
  id: string;
  label: string;
  /** The spending category an entry for this cost center most likely belongs to, used to preselect it. */
  group?: CategoryGroup;
}

/** Crop cycles and general farm spending are Agro; household, people and vehicles are Household. */
export function defaultGroupForCostCenter(type: CostCenter["type"]): CategoryGroup {
  return type === "crop_cycle" || type === "farm" ? "agro" : "household";
}

/** Crop cycles still open for new entries. `keepId` keeps an entry's own (possibly closed) cycle selectable on its edit form. */
export function openCropCycles(cropCycles: CropCycle[], keepId?: string): CropCycle[] {
  return cropCycles.filter((c) => c.status !== "closed" || c.id === keepId);
}

/**
 * Friendly label list for every cost center: crop cycles by their cycle label, others by name + type. Closed crop
 * cycles are left out, since nothing new can be logged to them, except `keepId` (the entry being edited).
 */
export function costCenterOptions(costCenters: CostCenter[], cropCycles: CropCycle[], keepId?: string): SelectOption[] {
  const closed = new Set(cropCycles.filter((c) => c.status === "closed").map((c) => c.id));
  const open = costCenters.filter((c) => c.id === keepId || !(c.cropCycleId && closed.has(c.cropCycleId)));
  return open.map((center) => {
    if (center.type === "crop_cycle") {
      const cycle = cropCycles.find((c) => c.id === center.cropCycleId);
      return {
        id: center.id,
        label: cycle ? cycle.label : center.name,
        group: defaultGroupForCostCenter(center.type),
      };
    }
    return {
      id: center.id,
      label: `${center.name} (${TYPE_LABEL[center.type]})`,
      group: defaultGroupForCostCenter(center.type),
    };
  });
}
