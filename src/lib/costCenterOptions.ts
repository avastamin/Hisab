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

/** Friendly label list for every cost center: crop cycles by their cycle label, others by name + type. */
export function costCenterOptions(costCenters: CostCenter[], cropCycles: CropCycle[]): SelectOption[] {
  return costCenters.map((center) => {
    if (center.type === "crop_cycle") {
      const cycle = cropCycles.find((c) => c.id === center.cropCycleId);
      return { id: center.id, label: cycle ? cycle.label : center.name, group: defaultGroupForCostCenter(center.type) };
    }
    return { id: center.id, label: `${center.name} (${TYPE_LABEL[center.type]})`, group: defaultGroupForCostCenter(center.type) };
  });
}
