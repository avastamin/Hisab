import { notFound } from "next/navigation";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { getAppData } from "@/lib/data/queries";
import { cropCycleFinancials } from "@/domain/calculations";
import { formatMoney } from "@/lib/format";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { CropCycleStatusSelect } from "@/components/CropCycleStatusSelect";
import { EntryList, buildEntryItems } from "@/components/entries/EntryList";

export default async function CropCycleDetailPage({ params }: PageProps<"/crop-cycles/[id]">) {
  const { id } = await params;
  const { cropCycles, costCenters, categories, expenseEntries, laborEntries, saleEntries, crops, workers } = await getAppData();

  const cycle = cropCycles.find((c) => c.id === id);
  if (!cycle) notFound();
  const costCenter = costCenters.find((c) => c.cropCycleId === cycle.id);
  const crop = crops.find((c) => c.id === cycle.cropId);

  const financials = costCenter
    ? cropCycleFinancials(cycle, costCenter, expenseEntries, laborEntries, saleEntries, categories)
    : null;

  const returnTo = encodeURIComponent(`/crop-cycles/${cycle.id}`);
  const entries = buildEntryItems({
    expenseEntries: expenseEntries.filter((e) => e.costCenterId === costCenter?.id),
    laborEntries: laborEntries.filter((e) => e.costCenterId === costCenter?.id),
    saleEntries: saleEntries.filter((e) => e.cropCycleId === cycle.id),
    categories,
    workers,
    costCenters,
    cropCycles,
    returnTo: `/crop-cycles/${cycle.id}`,
  });

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={cycle.label} backHref="/crop-cycles" />

      <Card>
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm text-text-secondary">{crop?.name ?? "Unknown crop"}</p>
          <Link href={`/crop-cycles/${cycle.id}/edit`} className="flex items-center gap-1 text-sm font-medium text-primary">
            <Pencil size={14} />
            Edit
          </Link>
        </div>
        {cycle.plotOrArea ? <p className="text-sm text-text-secondary">Plot: {cycle.plotOrArea}</p> : null}
        <p className="text-sm text-text-secondary">Started {cycle.startDate}</p>
        {cycle.plannedHarvestDate ? (
          <p className="text-sm text-text-secondary">Planned harvest: {cycle.plannedHarvestDate}</p>
        ) : null}

        <CropCycleStatusSelect id={cycle.id} status={cycle.status} />
      </Card>

      {financials ? (
        <Card>
          <h2 className="mb-3 text-base font-semibold text-text-primary">Financials</h2>
          <Row label="Total cost" value={formatMoney(financials.totalCost)} />
          <Row label="Total revenue" value={formatMoney(financials.totalRevenue)} />
          <Row
            label="Profit / Loss"
            value={formatMoney(financials.profitLoss)}
            tone={financials.profitLoss >= 0 ? "positive" : "negative"}
          />
          <Row label="Quantity sold" value={String(financials.totalQuantitySold)} />
          {financials.remainingStock !== null ? (
            <Row label="Remaining stock" value={`${financials.remainingStock} ${cycle.yieldUnit ?? ""}`} />
          ) : null}
          {financials.costPerUnitSold !== null ? (
            <Row label="Cost per unit sold" value={formatMoney(financials.costPerUnitSold)} />
          ) : null}

          {financials.costByCategory.length > 0 ? (
            <div className="mt-3 border-t border-border pt-3">
              <p className="mb-2 text-sm font-medium text-text-secondary">Cost by category</p>
              {financials.costByCategory.map((c) => (
                <Row key={c.categoryId} label={c.categoryName} value={formatMoney(c.total)} />
              ))}
            </div>
          ) : null}
        </Card>
      ) : null}

      <Card>
        <h2 className="mb-1 text-base font-semibold text-text-primary">Entries</h2>
        <EntryList entries={entries} emptyText="No expenses or sales yet." />
      </Card>

      <div className="flex flex-col gap-2">
        <Link href={`/add-expense?costCenterId=${costCenter?.id ?? ""}&returnTo=${returnTo}`} className="rounded-lg border border-border bg-surface-alt px-4 py-3 text-center font-semibold text-text-primary">
          Add Expense
        </Link>
        <Link href={`/add-sale?cropCycleId=${cycle.id}&returnTo=${returnTo}`} className="rounded-lg border border-border bg-surface-alt px-4 py-3 text-center font-semibold text-text-primary">
          Add Sale
        </Link>
      </div>
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: "positive" | "negative" }) {
  return (
    <div className="flex justify-between py-0.5 text-sm">
      <span className="text-text-secondary">{label}</span>
      <span
        className={
          tone === "positive" ? "font-semibold text-positive" : tone === "negative" ? "font-semibold text-negative" : "text-text-primary"
        }
      >
        {value}
      </span>
    </div>
  );
}
