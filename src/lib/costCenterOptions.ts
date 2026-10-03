import type { CostCenter, CropCycle } from "@/domain/types";

const TYPE_LABEL: Record<Exclude<CostCenter["type"], "crop_cycle">, string> = {
  vehicle: "Vehicle",
  person: "Person",
  general: "Household",
  farm: "Farm",
};

export interface SelectOption {
  id: string;
  label: string;
}

/** Friendly label list for every cost center: crop cycles by their cycle label, others by name + type. */
export function costCenterOptions(costCenters: CostCenter[], cropCycles: CropCycle[]): SelectOption[] {
  return costCenters.map((center) => {
    if (center.type === "crop_cycle") {
      const cycle = cropCycles.find((c) => c.id === center.cropCycleId);
      return { id: center.id, label: cycle ? cycle.label : center.name };
    }
    return { id: center.id, label: `${center.name} (${TYPE_LABEL[center.type]})` };
  });
}
