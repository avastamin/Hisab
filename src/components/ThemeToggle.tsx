"use client";

import { useSyncExternalStore } from "react";
import clsx from "clsx";
import { Monitor, Moon, Sun } from "lucide-react";
import { THEME_COOKIE, parseTheme, type ThemeChoice } from "@/lib/theme";

const OPTIONS: { value: ThemeChoice; label: string; icon: typeof Sun }[] = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

// The choice lives on <html data-theme> (set by the root layout from the cookie), so every toggle on the page
// reads it from there and re-renders when it changes.
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}
const currentTheme = () => parseTheme(document.documentElement.dataset.theme);
const serverTheme = (): ThemeChoice => "system";

function choose(next: ThemeChoice) {
  if (next === "system") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = next;
  document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
}

/** System / Light / Dark switch. Sets <html data-theme> straight away and remembers the choice for a year. */
export function ThemeToggle({ className }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, currentTheme, serverTheme);

  return (
    <div role="radiogroup" aria-label="Theme" className={clsx("flex rounded-lg border border-border p-0.5", className)}>
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={theme === value}
          onClick={() => choose(value)}
          className={clsx(
            "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium",
            theme === value ? "bg-surface-alt text-primary" : "text-text-secondary hover:text-text-primary",
          )}
        >
          <Icon size={14} aria-hidden />
          {label}
        </button>
      ))}
    </div>
  );
}
