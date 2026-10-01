import clsx from "clsx";

export function StatTile({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "positive" | "negative" | "neutral";
}) {
  return (
    <div className="flex-1 rounded-2xl border border-border bg-surface p-4 shadow-sm">
      <p className="text-xs font-medium text-text-secondary">{label}</p>
      <p
        className={clsx(
          "mt-1 text-xl font-bold",
          tone === "positive" && "text-positive",
          tone === "negative" && "text-negative",
          tone === "neutral" && "text-text-primary",
        )}
      >
        {value}
      </p>
    </div>
  );
}
