"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Home, Sprout, BarChart3, Settings, Plus } from "lucide-react";

const TABS: { href: string; label: string; icon: typeof Home; isAction?: boolean }[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/crop-cycles", label: "Crops", icon: Sprout },
  { href: "/add-expense", label: "Add", icon: Plus, isAction: true },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 z-10 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-md items-center justify-between px-2">
        {TABS.map((tab) => {
          const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          const Icon = tab.icon;
          if (tab.isAction) {
            return (
              <Link key={tab.href} href={tab.href} className="flex flex-1 flex-col items-center py-2">
                <span className="-mt-6 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-text shadow-md">
                  <Icon size={24} />
                </span>
                <span className="mt-1 text-[11px] font-medium text-text-secondary">{tab.label}</span>
              </Link>
            );
          }
          return (
            <Link key={tab.href} href={tab.href} className="flex flex-1 flex-col items-center gap-0.5 py-3">
              <Icon size={22} className={active ? "text-primary" : "text-text-secondary"} />
              <span className={clsx("text-[11px] font-medium", active ? "text-primary" : "text-text-secondary")}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
