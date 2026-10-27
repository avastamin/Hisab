import type { ReactNode } from "react";
import { BottomNav } from "@/components/BottomNav";
import { SideNav } from "@/components/SideNav";

// Phones get a single column with the bottom tab bar; from tablet width up, a sidebar and a wider content area.
// Pages that are just a form cap their own width (max-w-2xl / max-w-3xl) so fields don't stretch across a monitor.
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full">
      <SideNav />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="mx-auto w-full max-w-md flex-1 px-4 pb-24 pt-6 sm:max-w-2xl md:max-w-6xl md:px-8 md:pb-12 md:pt-8">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
