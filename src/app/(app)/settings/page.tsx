import Link from "next/link";
import { ChevronRight, Sprout, Tags, Bookmark, Users, CalendarDays, Car, Gauge, LogOut } from "lucide-react";
import { Card } from "@/components/Card";
import { signOut } from "@/lib/actions/auth";

const ITEMS = [
  { icon: Sprout, label: "Crops", href: "/settings/crops", description: "Rename or remove the crops you grow" },
  { icon: Tags, label: "Categories & tags", href: "/settings/categories", description: "Agro, Household and Other, and the tags under each" },
  { icon: Bookmark, label: "Labels", href: "/settings/tags", description: "Optional extras like Organic or Wholesale" },
  { icon: Users, label: "Workers", href: "/settings/workers", description: "Day labourers you pay, and their calendar colours" },
  { icon: CalendarDays, label: "Worker calendar", href: "/worker-calendar", description: "Which days each worker worked" },
  { icon: Car, label: "Vehicles & other cost centers", href: "/settings/cost-centers", description: "Bikes, family members, and other household spending targets" },
  { icon: Gauge, label: "Monthly Budget", href: "/settings/budget", description: "Optional: set a household spending goal and track progress" },
];

export default function SettingsPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <h1 className="text-xl font-bold text-text-primary">Settings</h1>

      <div className="grid gap-3 md:grid-cols-2">
        {ITEMS.map((item) => (
          <Link key={item.href} href={item.href} className="[&>div]:h-full">
            <Card className="flex items-center gap-3">
              <item.icon size={20} className="text-primary" />
              <div className="flex-1">
                <p className="font-semibold text-text-primary">{item.label}</p>
                <p className="text-xs text-text-secondary">{item.description}</p>
              </div>
              <ChevronRight size={18} className="text-text-secondary" />
            </Card>
          </Link>
        ))}
      </div>

      <form action={signOut}>
        <button type="submit" className="flex w-full items-center md:w-auto md:px-6 justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-3 font-semibold text-negative">
          <LogOut size={18} />
          Log out
        </button>
      </form>
    </div>
  );
}
