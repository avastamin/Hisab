import Link from "next/link";
import { ChevronRight, Tags, Bookmark, Users, Car, Gauge, LogOut } from "lucide-react";
import { Card } from "@/components/Card";
import { signOut } from "@/lib/actions/auth";

const ITEMS = [
  { icon: Tags, label: "Categories", href: "/settings/categories", description: "Manage cost and revenue categories" },
  { icon: Bookmark, label: "Tags", href: "/settings/tags", description: "Freeform labels for filtering entries" },
  { icon: Users, label: "Workers", href: "/settings/workers", description: "Day laborers you pay" },
  { icon: Car, label: "Vehicles & other cost centers", href: "/settings/cost-centers", description: "Bikes, family members, and other household spending targets" },
  { icon: Gauge, label: "Monthly Budget", href: "/settings/budget", description: "Optional: set a household spending goal and track progress" },
];

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-text-primary">Settings</h1>

      <div className="flex flex-col gap-3">
        {ITEMS.map((item) => (
          <Link key={item.href} href={item.href}>
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
        <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-3 font-semibold text-negative">
          <LogOut size={18} />
          Log out
        </button>
      </form>
    </div>
  );
}
