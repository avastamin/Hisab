import { getAppData } from "@/lib/data/queries";
import { addLabor } from "@/lib/actions/entries";
import { costCenterOptions } from "@/lib/costCenterOptions";
import { safeReturnTo } from "@/lib/returnTo";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { LaborForm } from "@/components/entries/EntryForms";

export default async function AddLaborPage({ searchParams }: PageProps<"/add-labor">) {
  const returnTo = safeReturnTo((await searchParams).returnTo);
  const { cropCycles, costCenters, categories, tags, workers } = await getAppData();

  return (
    <div>
      <PageHeader title="Add Labour" backHref={returnTo} />
      <Card>
        {workers.length === 0 ? (
          <p className="text-sm text-text-secondary">
            Add a worker first in Settings → Workers before logging labour.
          </p>
        ) : (
          <LaborForm
            action={addLabor}
            categories={categories.filter((c) => c.kind === "cost")}
            tags={tags}
            costOptions={costCenterOptions(costCenters, cropCycles)}
            workers={workers}
            returnTo={returnTo}
            submitLabel="Save Labour"
          />
        )}
      </Card>
    </div>
  );
}
