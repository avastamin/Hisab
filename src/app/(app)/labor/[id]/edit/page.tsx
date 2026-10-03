import { notFound } from "next/navigation";
import { getAppData } from "@/lib/data/queries";
import { updateLabor, deleteLabor } from "@/lib/actions/entries";
import { costCenterOptions } from "@/lib/costCenterOptions";
import { safeReturnTo } from "@/lib/returnTo";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { LaborForm } from "@/components/entries/EntryForms";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";

export default async function EditLaborPage({ params, searchParams }: PageProps<"/labor/[id]/edit">) {
  const { id } = await params;
  const returnTo = safeReturnTo((await searchParams).returnTo);
  const { cropCycles, costCenters, categories, tags, workers, laborEntries } = await getAppData();

  const entry = laborEntries.find((e) => e.id === id);
  if (!entry) notFound();

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Edit Labour" backHref={returnTo} />
      <Card>
        <LaborForm
          action={updateLabor}
          categories={categories.filter((c) => c.kind === "cost")}
          tags={tags}
          costOptions={costCenterOptions(costCenters, cropCycles)}
          workers={workers}
          entry={entry}
          returnTo={returnTo}
          submitLabel="Save Changes"
        />
      </Card>
      <ConfirmDeleteButton action={deleteLabor} id={entry.id} returnTo={returnTo} label="labour entry" />
    </div>
  );
}
