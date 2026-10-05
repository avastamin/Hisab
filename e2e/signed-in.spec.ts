import { expect, test } from "@playwright/test";
import { expectToast, hasCredentials, logIn, runId, selectByLabel } from "./helpers";

// One walk through the app as a farmer would use it, checking totals and the toast after every change. Everything
// it creates is named "E2E … <runId>" and deleted at the end.
test.describe("signed in", () => {
  test.skip(!hasCredentials, "Set E2E_EMAIL and E2E_PASSWORD (a dedicated test account) to run the signed-in tests");

  const worker = `E2E Worker ${runId}`;
  const crop = `E2E Crop ${runId}`;
  const cycle = `E2E Cycle ${runId}`;

  test("crop cycle: add, edit and delete entries with toasts", async ({ page }) => {
    await logIn(page);
    await expectToast(page, "success", "Welcome back");

    await test.step("add a worker", async () => {
      await page.goto("/settings/workers");
      await page.getByLabel("Name", { exact: true }).fill(worker);
      await page.getByLabel("Default daily rate (optional)").fill("500");
      await page.getByRole("button", { name: "Add Worker" }).click();
      await expectToast(page, "success", `${worker} added`);
      await expect(page.getByText(worker)).toBeVisible();
    });

    await test.step("add a crop (auto-selected) and a crop cycle", async () => {
      await page.goto("/new-crop-cycle");
      await page.getByPlaceholder("Crop name").fill(crop);
      await page.getByRole("button", { name: "Add", exact: true }).click();
      await expectToast(page, "success", `"${crop}" added`);
      await expect(page.getByLabel("Crop", { exact: true })).toHaveValue(/.+/);
      await expect(page.getByLabel("Crop", { exact: true }).locator("option:checked")).toHaveText(crop);

      await page.getByLabel("Label", { exact: true }).fill(cycle);
      await page.getByLabel("Expected yield (optional)").fill("100");
      await page.getByRole("button", { name: "Create Crop Cycle" }).click();
      await expectToast(page, "success", `Crop cycle "${cycle}" created`);
      await expect(page.getByRole("heading", { name: cycle })).toBeVisible();
    });

    const cycleUrl = page.url();

    await test.step("adding the same crop again warns instead of duplicating", async () => {
      await page.goto("/new-crop-cycle");
      await page.getByPlaceholder("Crop name").fill(crop.toUpperCase());
      await page.getByRole("button", { name: "Add", exact: true }).click();
      await expectToast(page, "warning", "already in your crop list");
      await page.goto(cycleUrl);
    });

    await test.step("Agro → Seeds expense, back on the cycle", async () => {
      await page.getByRole("link", { name: "Add Expense" }).click();
      // A crop cycle's expense defaults to the Agro category.
      await expect(page.getByLabel("Category", { exact: true }).locator("option:checked")).toHaveText("Agro");
      await selectByLabel(page, "Tag", "Seeds");
      await page.getByLabel("Amount").fill("1000");
      await page.getByRole("button", { name: "Save Expense" }).click();
      await expectToast(page, "success", "Expense saved");
      await expect(page).toHaveURL(cycleUrl);
      await expect(page.getByText("৳ 1,000.00").first()).toBeVisible();
    });

    await test.step("Agro → Labour asks for a worker and saves a labour entry", async () => {
      await page.getByRole("link", { name: "Add Expense" }).click();
      await selectByLabel(page, "Tag", "Labour");
      await selectByLabel(page, "Worker", worker);
      await expect(page.getByLabel("Daily rate")).toHaveValue("500");
      await page.getByLabel("Days worked").fill("2");
      await expect(page.getByText("Total: ৳ 1,000.00")).toBeVisible();
      await page.getByRole("button", { name: "Save Expense" }).click();
      await expectToast(page, "success", "Labour entry saved");
      await expect(page).toHaveURL(cycleUrl);
      await expect(page.getByText(`${worker} · Labour`)).toBeVisible();
    });

    await test.step("add a sale with a live total", async () => {
      await page.getByRole("link", { name: "Add Sale" }).click();
      await selectByLabel(page, "Category", "Harvest Sale");
      await page.getByLabel("Quantity").fill("40");
      await page.getByLabel("Unit price").fill("100");
      await expect(page.getByText("Total: ৳ 4,000.00")).toBeVisible();
      await page.getByRole("button", { name: "Save Sale" }).click();
      await expectToast(page, "success", "Sale saved");
      await expect(page).toHaveURL(cycleUrl);
      // Cost 2,000 (seeds + labour), revenue 4,000.
      await expect(page.getByText("৳ 2,000.00").first()).toBeVisible();
      await expect(page.getByText("৳ 4,000.00").first()).toBeVisible();
    });

    await test.step("edit the sale", async () => {
      await page.getByRole("link", { name: /^Sale/ }).click();
      await page.getByLabel("Quantity").fill("50");
      await page.getByRole("button", { name: "Save Changes" }).click();
      await expectToast(page, "success", "Sale updated");
      await expect(page).toHaveURL(cycleUrl);
      await expect(page.getByText("৳ 5,000.00").first()).toBeVisible();
    });

    await test.step("cancelling a delete keeps the entry", async () => {
      await page.getByRole("link", { name: /^Seeds/ }).click();
      page.once("dialog", (d) => d.dismiss());
      await page.getByRole("button", { name: "Delete expense" }).click();
      await expectToast(page, "info", "Nothing was deleted");
      await page.goto(cycleUrl);
    });

    await test.step("delete the Seeds expense", async () => {
      await page.getByRole("link", { name: /^Seeds/ }).click();
      page.once("dialog", (d) => d.accept());
      await page.getByRole("button", { name: "Delete expense" }).click();
      await expectToast(page, "success", "Expense deleted");
      await expect(page).toHaveURL(cycleUrl);
      await expect(page.getByRole("link", { name: /^Seeds/ })).toHaveCount(0);
    });

    await test.step("change the status", async () => {
      await page.locator('select[name="status"]').selectOption("growing");
      await expectToast(page, "info", "Status changed to Growing");
    });

    await test.step("reports break Agro down by tag", async () => {
      await page.goto("/reports");
      await expect(page.getByRole("heading", { name: "Spending by category" })).toBeVisible();
      await expect(page.getByText("Agro", { exact: true })).toBeVisible();
      await expect(page.getByText("Labour", { exact: true }).first()).toBeVisible();
    });

    await test.step("clean up: delete the cycle (and its entries), the crop and the worker", async () => {
      await page.goto(cycleUrl);
      await page.getByRole("link", { name: "Edit" }).click();
      page.once("dialog", (d) => d.accept());
      await page.getByRole("button", { name: "Delete crop cycle" }).click();
      await expectToast(page, "success", "Crop cycle deleted");
      await expect(page.getByText(cycle)).toHaveCount(0);

      await page.goto("/settings/crops");
      const cropRow = page.locator("div.flex.flex-col").filter({ has: page.locator(`input[value="${crop}"]`) }).last();
      page.once("dialog", (d) => d.accept());
      await cropRow.getByRole("button", { name: "Delete crop" }).click();
      await expectToast(page, "success", "Crop deleted");

      // The labour entry went with the cycle, so the worker is unused and can go too.
      await page.goto("/settings/workers");
      const workerRow = page.locator("div").filter({ hasText: worker }).last();
      page.once("dialog", (d) => d.accept());
      await workerRow.getByRole("button", { name: "Delete worker" }).click();
      await expectToast(page, "success", "Worker deleted");
    });
  });

  test("settings: add, move and delete a tag", async ({ page }) => {
    const tag = `E2E Tag ${runId}`;
    await logIn(page);
    await page.goto("/settings/categories");

    await page.getByLabel("New tag").fill(tag);
    await page.getByLabel("Under").selectOption("household");
    await page.getByRole("button", { name: "Add Tag" }).click();
    await expectToast(page, "success", `Added "${tag}" to Household`);

    await page.getByText(tag).click();
    const row = page.locator("details").filter({ hasText: tag });
    await row.getByLabel("Category").selectOption("other");
    await row.getByRole("button", { name: "Save" }).click();
    await expectToast(page, "success", `Saved "${tag}"`);
    await expect(page.locator("section").filter({ hasText: /^Other/ }).getByText(tag)).toBeVisible();

    await page.getByText(tag).click();
    page.once("dialog", (d) => d.accept());
    await page.locator("details").filter({ hasText: tag }).getByRole("button", { name: "Delete tag" }).click();
    await expectToast(page, "success", "Deleted");
    await expect(page.getByText(tag)).toHaveCount(0);
  });
});
