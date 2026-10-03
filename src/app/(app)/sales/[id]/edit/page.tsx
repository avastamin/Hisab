import { notFound } from "next/navigation";
import { getAppData } from "@/lib/data/queries";
import { updateSale, deleteSale } from "@/lib/actions/entries";
import { safeReturnTo } from "@/lib/returnTo";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { SaleForm } from "@/components/entries/EntryForms";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";

export default async function EditSalePage({ params, searchParams }: PageProps<"/sales/[id]/edit">) {
  const { id } = await params;
  const returnTo = safeReturnTo((await searchParams).returnTo);
  const { cropCycles, categories, tags, saleEntries } = await getAppData();

  const entry = saleEntries.find((e) => e.id === id);
  if (!entry) notFound();

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Edit Sale" backHref={returnTo} />
      <Card>
        <SaleForm
          action={updateSale}
          categories={categories.filter((c) => c.kind === "revenue")}
          tags={tags}
          cropCycles={cropCycles}
          entry={entry}
          returnTo={returnTo}
          submitLabel="Save Changes"
        />
      </Card>
      <ConfirmDeleteButton action={deleteSale} id={entry.id} returnTo={returnTo} label="sale" />
    </div>
  );
}
