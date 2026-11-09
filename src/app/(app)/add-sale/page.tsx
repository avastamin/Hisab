import { getAppData } from "@/lib/data/queries";
import { safeReturnTo } from "@/lib/returnTo";
import { isoDateParam } from "@/lib/format";
import { openCropCycles } from "@/lib/costCenterOptions";
import { addSale } from "@/lib/actions/entries";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { SaleForm } from "@/components/entries/EntryForms";

export default async function AddSalePage({ searchParams }: PageProps<"/add-sale">) {
  const { cropCycleId, date, returnTo: returnToParam } = await searchParams;
  const returnTo = safeReturnTo(returnToParam);
  const { cropCycles: allCropCycles, categories, tags } = await getAppData();
  const cropCycles = openCropCycles(allCropCycles);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <PageHeader title="Add Sale" backHref={returnTo} />
      <Card>
        {cropCycles.length === 0 ? (
          <p className="text-sm text-text-secondary">
            No open crop cycles. Start a crop cycle in the Crops tab before logging a sale.
          </p>
        ) : (
          <SaleForm
            action={addSale}
            categories={categories.filter((c) => c.kind === "revenue")}
            tags={tags}
            cropCycles={cropCycles}
            defaultCropCycleId={typeof cropCycleId === "string" ? cropCycleId : undefined}
            defaultDate={isoDateParam(date)}
            returnTo={returnTo}
            submitLabel="Save Sale"
          />
        )}
      </Card>
    </div>
  );
}
