import { notFound } from "next/navigation";
import { getAppData } from "@/lib/data/queries";
import { updateCropCycle, deleteCropCycle } from "@/lib/actions/entries";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { CropCycleForm } from "@/components/crops/CropCycleForm";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";

export default async function EditCropCyclePage({ params }: PageProps<"/crop-cycles/[id]/edit">) {
  const { id } = await params;
  const { crops, cropCycles, costCenters, expenseEntries, laborEntries, saleEntries } = await getAppData();

  const cycle = cropCycles.find((c) => c.id === id);
  if (!cycle) notFound();

  // Deleting the cycle cascades to everything recorded against it, so say how much that is.
  const costCenterId = costCenters.find((c) => c.cropCycleId === cycle.id)?.id;
  const entryCount =
    expenseEntries.filter((e) => e.costCenterId === costCenterId).length +
    laborEntries.filter((e) => e.costCenterId === costCenterId).length +
    saleEntries.filter((e) => e.cropCycleId === cycle.id).length;
  const message =
    entryCount > 0
      ? `Delete "${cycle.label}" and its ${entryCount} expense, labour and sale entr${entryCount === 1 ? "y" : "ies"}? This can't be undone.`
      : `Delete "${cycle.label}"? This can't be undone.`;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Edit Crop Cycle" backHref={`/crop-cycles/${cycle.id}`} />
      <Card>
        <CropCycleForm action={updateCropCycle} crops={crops} cycle={cycle} submitLabel="Save Changes" />
      </Card>
      <ConfirmDeleteButton action={deleteCropCycle} id={cycle.id} label="crop cycle" message={message} />
    </div>
  );
}
