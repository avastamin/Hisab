import { expect, test } from "@playwright/test";

test.describe("signed out", () => {
  test("app pages send you to the login page", async ({ page }) => {
    await page.goto("/reports");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
  });

  test("a wrong password shows an error and stays on the login page", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("nobody@example.invalid");
    await page.getByLabel("Password").fill("not-the-password");
    await page.getByRole("button", { name: /log in|sign in/i }).click();
    await expect(page.getByText(/invalid|credentials|email/i).first()).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });
});
