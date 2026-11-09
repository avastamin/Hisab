/** Light or dark, or "system" to follow the device. Saved in a cookie so the server renders the right one. */
export type ThemeChoice = "system" | "light" | "dark";

export const THEME_COOKIE = "hisab-theme";

export function parseTheme(value: unknown): ThemeChoice {
  return value === "light" || value === "dark" ? value : "system";
}
