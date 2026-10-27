import { getAppData } from "@/lib/data/queries";
import { PendingButton } from "@/components/form/PendingButton";
import { addCropCycle, addCrop } from "@/lib/actions/entries";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { TextInput } from "@/components/form/Field";
import { CropCycleForm } from "@/components/crops/CropCycleForm";

export default async function NewCropCyclePage({ searchParams }: PageProps<"/new-crop-cycle">) {
  const { cropId } = await searchParams;
  const { crops } = await getAppData();
  // Set by addCrop so the crop that was just added is already selected.
  const newCropId = typeof cropId === "string" ? cropId : undefined;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <PageHeader title="New Crop Cycle" backHref="/crop-cycles" />

      <Card>
        <p className="mb-3 text-sm text-text-secondary">
          {crops.length === 0
            ? 'Add a crop first (e.g. "Tomato", "Rice").'
            : "Growing something new? Add it to your crop list."}
        </p>
        <form action={addCrop} className="flex gap-2">
          <TextInput type="text" name="name" placeholder="Crop name" required className="flex-1" />
          <PendingButton className="rounded-lg bg-primary px-4 py-2.5 font-semibold text-primary-text hover:brightness-110">
            Add
          </PendingButton>
        </form>
      </Card>

      {crops.length > 0 ? (
        <Card>
          <CropCycleForm key={newCropId} action={addCropCycle} crops={crops} defaultCropId={newCropId} submitLabel="Create Crop Cycle" />
        </Card>
      ) : null}
    </div>
  );
}
