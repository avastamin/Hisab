import { getAppData } from "@/lib/data/queries";
import { addLabor } from "@/lib/actions/entries";
import { costCenterOptions } from "@/lib/costCenterOptions";
import { safeReturnTo } from "@/lib/returnTo";
import { isoDateParam } from "@/lib/format";
import { otherWorkDays } from "@/lib/workDates";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { LaborForm } from "@/components/entries/EntryForms";

export default async function AddLaborPage({ searchParams }: PageProps<"/add-labor">) {
  const params = await searchParams;
  const returnTo = safeReturnTo(params.returnTo);
  const { cropCycles, costCenters, categories, tags, workers, laborEntries } = await getAppData();

  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader title="Add Labour" backHref={returnTo} />
      <Card>
        <LaborForm
          action={addLabor}
          categories={categories.filter((c) => c.kind === "cost")}
          tags={tags}
          costOptions={costCenterOptions(costCenters, cropCycles)}
          workers={workers}
          otherWorkDays={otherWorkDays(laborEntries)}
          defaultDate={isoDateParam(params.date)}
          returnTo={returnTo}
          submitLabel="Save Labour"
        />
      </Card>
    </div>
  );
}
