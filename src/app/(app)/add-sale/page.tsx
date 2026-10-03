import { getAppData } from "@/lib/data/queries";
import { safeReturnTo } from "@/lib/returnTo";
import { addSale } from "@/lib/actions/entries";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { SaleForm } from "@/components/entries/EntryForms";

export default async function AddSalePage({ searchParams }: PageProps<"/add-sale">) {
  const { cropCycleId, returnTo: returnToParam } = await searchParams;
  const returnTo = safeReturnTo(returnToParam);
  const { cropCycles, categories, tags } = await getAppData();

  return (
    <div>
      <PageHeader title="Add Sale" backHref={returnTo} />
      <Card>
        {cropCycles.length === 0 ? (
          <p className="text-sm text-text-secondary">Start a crop cycle first in the Crops tab before logging a sale.</p>
        ) : (
          <SaleForm
            action={addSale}
            categories={categories.filter((c) => c.kind === "revenue")}
            tags={tags}
            cropCycles={cropCycles}
            defaultCropCycleId={typeof cropCycleId === "string" ? cropCycleId : undefined}
            returnTo={returnTo}
            submitLabel="Save Sale"
          />
        )}
      </Card>
    </div>
  );
}
