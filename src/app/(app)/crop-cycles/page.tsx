import Link from "next/link";
import { getAppData } from "@/lib/data/queries";
import { Card } from "@/components/Card";

const STATUS_LABEL: Record<string, string> = {
  planned: "Planned",
  growing: "Growing",
  harvested: "Harvested",
  closed: "Closed",
};

export default async function CropCyclesPage() {
  const { cropCycles, crops } = await getAppData();
  const cropName = (id: string) => crops.find((c) => c.id === id)?.name ?? "Unknown crop";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">Crop Cycles</h1>
        <Link href="/new-crop-cycle" className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-text">
          + New
        </Link>
      </div>

      {cropCycles.length === 0 ? (
        <Card>
          <p className="text-sm text-text-secondary">No crop cycles yet. Create one to start tracking cost and revenue.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {cropCycles.map((cycle) => (
            <Link key={cycle.id} href={`/crop-cycles/${cycle.id}`}>
              <Card>
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-text-primary">{cycle.label}</p>
                  <span className="rounded-full bg-surface-alt px-2.5 py-1 text-xs font-medium text-text-secondary">
                    {STATUS_LABEL[cycle.status]}
                  </span>
                </div>
                <p className="mt-1 text-sm text-text-secondary">
                  {cropName(cycle.cropId)} · started {cycle.startDate}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
