import { getAppData } from "@/lib/data/queries";
import { renameCrop, deleteCrop } from "@/lib/actions/entries";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { TextInput } from "@/components/form/Field";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";

export default async function CropsPage() {
  const { crops, cropCycles } = await getAppData();

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Crops" backHref="/settings" />
      <p className="-mt-2 text-sm text-text-secondary">
        A crop is what you grow (e.g. &quot;Banana&quot;). Each planting of it is a crop cycle. New crops are added from
        Crops → New.
      </p>

      <div className="flex flex-col gap-2">
        {crops.map((crop) => {
          const cycleCount = cropCycles.filter((c) => c.cropId === crop.id).length;
          return (
            <Card key={crop.id} className="flex flex-col gap-2 py-3">
              <div className="flex items-center gap-2">
                <form action={renameCrop} className="flex flex-1 gap-2">
                  <input type="hidden" name="id" value={crop.id} />
                  <TextInput type="text" name="name" defaultValue={crop.name} required aria-label="Crop name" className="min-w-0 flex-1" />
                  <button type="submit" className="rounded-lg border border-border bg-surface-alt px-3 text-sm font-semibold text-text-primary">
                    Save
                  </button>
                </form>
                {/* Deleting a crop would also delete its cycles and their entries, so only empty crops can go. */}
                {cycleCount === 0 ? <ConfirmDeleteButton action={deleteCrop} id={crop.id} label="crop" compact /> : null}
              </div>
              <p className="text-xs text-text-secondary">
                {cycleCount === 0
                  ? "No crop cycles"
                  : `${cycleCount} crop cycle${cycleCount === 1 ? "" : "s"} · delete those first to remove this crop`}
              </p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
