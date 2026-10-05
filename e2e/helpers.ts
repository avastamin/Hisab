import { expect, type Page } from "@playwright/test";

export const credentials = {
  email: process.env.E2E_EMAIL ?? "",
  password: process.env.E2E_PASSWORD ?? "",
};

export const hasCredentials = credentials.email !== "" && credentials.password !== "";

/** A unique suffix so repeated runs never collide with each other or with real data. */
export const runId = Date.now().toString(36);

export async function logIn(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(credentials.email);
  await page.getByLabel("Password").fill(credentials.password);
  await page.getByRole("button", { name: /log in|sign in/i }).click();
  await expect(page).toHaveURL(/\/$/);
}

/** Waits for a toast of the given type whose text matches. */
export async function expectToast(page: Page, type: "success" | "error" | "warning" | "info", text: string | RegExp) {
  await expect(page.locator(`[data-toast-type="${type}"]`).filter({ hasText: text }).last()).toBeVisible();
}

/** Picks an <option> by its visible text, for selects whose values are database ids. */
export async function selectByLabel(page: Page, name: string | RegExp, option: string) {
  await page.getByLabel(name, { exact: typeof name === "string" }).selectOption({ label: option });
}
