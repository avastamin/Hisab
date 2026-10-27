"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Home, Sprout, BarChart3, Settings, CalendarDays, List, Plus } from "lucide-react";

const LINKS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/crop-cycles", label: "Crops", icon: Sprout },
  { href: "/entries", label: "All entries", icon: List },
  { href: "/worker-calendar", label: "Worker calendar", icon: CalendarDays },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

const ADD_LINKS = [
  { href: "/add-expense", label: "Add Expense" },
  { href: "/add-labor", label: "Add Labour" },
  { href: "/add-sale", label: "Add Sale" },
];

/** Navigation for tablet and desktop widths; phones get the BottomNav instead. */
export function SideNav() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-6 border-r border-border bg-surface px-3 py-6 md:flex">
      <Link href="/" className="flex items-center gap-2 px-3">
        <Image src="/icons/icon-192.png" alt="" width={28} height={28} className="rounded-lg" />
        <span className="text-lg font-bold text-text-primary">Hisab</span>
      </Link>

      <nav aria-label="Main" className="flex flex-col gap-1">
        {LINKS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={isActive(href) ? "page" : undefined}
            className={clsx(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
              isActive(href) ? "bg-surface-alt text-primary" : "text-text-secondary hover:bg-surface-alt hover:text-text-primary",
            )}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>

      <div className="flex flex-col gap-1.5 border-t border-border pt-4">
        {ADD_LINKS.map(({ href, label }, i) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold",
              i === 0 ? "bg-primary text-primary-text" : "text-text-primary hover:bg-surface-alt",
            )}
          >
            <Plus size={16} />
            {label}
          </Link>
        ))}
      </div>
    </aside>
  );
}
