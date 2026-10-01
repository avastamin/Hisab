import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export function PageHeader({ title, backHref }: { title: string; backHref?: string }) {
  return (
    <div className="mb-5 flex items-center gap-2">
      {backHref ? (
        <Link href={backHref} className="-ml-1 rounded-full p-1 text-text-secondary">
          <ChevronLeft size={22} />
        </Link>
      ) : null}
      <h1 className="text-xl font-bold text-text-primary">{title}</h1>
    </div>
  );
}
