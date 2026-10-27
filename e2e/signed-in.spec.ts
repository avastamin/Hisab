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
      await expect(page.getByText(worker, { exact: true })).toBeVisible();
    });

    await test.step("add a crop (auto-selected) and a crop cycle", async () => {
      await page.goto("/new-crop-cycle");
      await page.getByPlaceholder("Crop name").fill(crop);
      await page.getByRole("button", { name: "Add", exact: true }).click();
      await expectToast(page, "success", `"${crop}" added`);
      await expect(page.getByRole("combobox", { name: "Crop", exact: true })).toHaveValue(/.+/);
      await expect(page.getByRole("combobox", { name: "Crop", exact: true }).locator("option:checked")).toHaveText(crop);

      await page.getByRole("textbox", { name: /^Label\b/ }).fill(cycle);
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
      await expect(page.getByRole("combobox", { name: "Category", exact: true }).locator("option:checked")).toHaveText("Agro");
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
      // Picking days on the calendar fills in Days worked; tapping a day again removes it.
      const month = new Date().toISOString().slice(0, 7);
      const day = (d: string) => page.locator(`.fc-daygrid-day[data-date="${month}-${d}"]`);
      for (const d of ["01", "02", "03"]) await day(d).click();
      await expect(page.getByLabel("Days worked")).toHaveValue("3");
      await day("03").locator(".fc-event", { hasText: worker }).click();
      await expect(page.getByLabel("Days worked")).toHaveValue("2");
      await expect(page.getByText("2 days picked")).toBeVisible();
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
      await expect(page.getByText(cycle, { exact: true })).toHaveCount(0);

      await page.goto("/settings/crops");
      const cropRow = page.locator("div.flex.flex-col").filter({ has: page.locator(`input[value="${crop}"]`) }).last();
      page.once("dialog", (d) => d.accept());
      await cropRow.getByRole("button", { name: "Delete crop" }).click();
      await expectToast(page, "success", "Crop deleted");

      // The labour entry went with the cycle, so the worker is unused and can go too.
      await page.goto("/settings/workers");
      const deleteButton = page.getByRole("button", { name: "Delete worker" });
      const workerRow = page.locator("div").filter({ hasText: worker }).filter({ has: deleteButton }).last();
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

    await page.getByText(tag, { exact: true }).click();
    const row = page.locator("details").filter({ hasText: tag });
    await row.getByLabel("Category").selectOption("other");
    await row.getByRole("button", { name: "Save" }).click();
    await expectToast(page, "success", `Saved "${tag}"`);
    await expect(page.locator("section").filter({ hasText: /^Other/ }).getByText(tag, { exact: true })).toBeVisible();

    await page.getByText(tag, { exact: true }).click();
    page.once("dialog", (d) => d.accept());
    await page.locator("details").filter({ hasText: tag }).getByRole("button", { name: "Delete tag" }).click();
    await expectToast(page, "success", "Deleted");
    await expect(page.getByText(tag, { exact: true })).toHaveCount(0);
  });

  test("labour calendar: several workers, their days, edits and colours", async ({ page }) => {
    const [ali, bina] = [`E2E Ali ${runId}`, `E2E Bina ${runId}`];
    const month = new Date().toISOString().slice(0, 7);
    const day = (d: string) => page.locator(`.fc-daygrid-day[data-date="${month}-${d}"]`);
    const workerRow = (name: string) =>
      page.locator("div").filter({ hasText: name }).filter({ has: page.getByRole("button", { name: "Delete worker" }) }).last();
    await logIn(page);

    await test.step("add two workers", async () => {
      await page.goto("/settings/workers");
      for (const [name, rate] of [[ali, "400"], [bina, "600"]]) {
        await page.getByLabel("Name", { exact: true }).fill(name);
        await page.getByLabel("Default daily rate (optional)").fill(rate);
        await page.getByRole("button", { name: "Add Worker" }).click();
        await expectToast(page, "success", `${name} added`);
      }
    });

    await test.step("one form saves an entry per worker, each with their own days", async () => {
      await page.goto("/add-labor");
      await selectByLabel(page, "What is this for?", "General farm (Farm)");
      await selectByLabel(page, "Worker", ali);
      for (const d of ["01", "02"]) await day(d).click();
      await page.getByRole("button", { name: "Add another worker" }).click();
      await selectByLabel(page, "Worker 2", bina);
      for (const d of ["02", "03", "04"]) await day(d).click();
      await expect(page.getByLabel("Days worked").nth(0)).toHaveValue("2");
      await expect(page.getByLabel("Days worked").nth(1)).toHaveValue("3");
      await expect(page.getByText("Total: ৳ 2,600.00")).toBeVisible();
      await page.getByRole("button", { name: "Save Labour" }).click();
      await expectToast(page, "success", "2 labour entries saved");
    });

    await test.step("the worker calendar shows who worked when", async () => {
      await page.goto("/worker-calendar");
      await expect(day("02").locator(".fc-event", { hasText: ali })).toHaveCount(1);
      await expect(day("02").locator(".fc-event", { hasText: bina })).toHaveCount(1);
      await expect(day("04").locator(".fc-event", { hasText: bina })).toHaveCount(1);
      await expect(page.getByRole("button", { name: new RegExp(`${ali}.*2 worked`) })).toBeVisible();
    });

    await test.step("tapping a day opens the entry, where days can be added", async () => {
      await day("01").locator(".fc-event", { hasText: ali }).click();
      await expect(page.getByRole("heading", { name: "Edit Labour" })).toBeVisible();
      await expect(page.getByLabel("Days worked")).toHaveValue("2");
      // Bina's days are shown faintly for context.
      await expect(day("03").locator(".work-mark-faint", { hasText: bina })).toHaveCount(1);
      await day("05").click();
      await expect(page.getByLabel("Days worked")).toHaveValue("3");
      await page.getByRole("button", { name: "Save Changes" }).click();
      await expectToast(page, "success", "Labour entry updated");
    });

    await test.step("picking a day that's already recorded warns", async () => {
      await page.goto("/add-labor");
      await selectByLabel(page, "Worker", ali);
      await day("05").click();
      await expect(page.getByText(/Already in another labour entry/)).toBeVisible();
    });

    await test.step("a worker's colour can be changed", async () => {
      await page.goto("/settings/workers");
      const red = page.locator(`form[aria-label="Calendar colour for ${bina}"]`).getByRole("button", { name: "Red" });
      await red.click();
      await expect(red).toHaveAttribute("aria-pressed", "true");
    });

    await test.step("clean up: delete both entries and both workers", async () => {
      for (const name of [ali, bina]) {
        await page.goto("/worker-calendar");
        await day("02").locator(".fc-event", { hasText: name }).click();
        page.once("dialog", (d) => d.accept());
        await page.getByRole("button", { name: "Delete labour entry" }).click();
        await expectToast(page, "success", "Labour entry deleted");
      }
      await page.goto("/settings/workers");
      for (const name of [ali, bina]) {
        page.once("dialog", (d) => d.accept());
        await workerRow(name).getByRole("button", { name: "Delete worker" }).click();
        await expectToast(page, "success", "Worker deleted");
      }
    });
  });

  test("home charts: preset and custom ranges", async ({ page }) => {
    await logIn(page);
    const donutTitle = page.getByRole("heading", { name: /^Expense vs Revenue/ });
    const bars = page.getByRole("button", { name: /: revenue ৳/ });

    await page.getByRole("button", { name: "3 months" }).click();
    await expect(page).toHaveURL(/\?range=3$/);
    await expect(donutTitle).toHaveText("Expense vs Revenue (last 3 months)");
    await expect(bars).toHaveCount(3);

    await page.getByRole("button", { name: "1 month" }).click();
    await expect(donutTitle).toHaveText("Expense vs Revenue (this month)");
    await expect(bars).toHaveCount(1);

    await page.getByRole("button", { name: "Custom" }).click();
    await page.getByLabel("Start date").fill("2026-01-15");
    await page.getByLabel("End date").fill("2026-03-10");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page).toHaveURL(/range=custom&from=2026-01-15&to=2026-03-10/);
    await expect(donutTitle).toHaveText("Expense vs Revenue (Jan 15, 2026 – Mar 10, 2026)");
    await expect(bars).toHaveCount(3);
    await expect(page.getByRole("button", { name: /^Jan 2026:/ })).toBeVisible();

    await page.getByRole("button", { name: "12 months" }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(bars).toHaveCount(12);
  });

  test("action buttons show a spinner while the server works", async ({ page }) => {
    const tag = `E2E Busy ${runId}`;
    await logIn(page);
    await page.goto("/settings/tags");
    await page.getByLabel("Name", { exact: true }).fill(tag);
    const add = page.getByRole("button", { name: "Add Label" });
    await add.click();
    await expect(add).toHaveAttribute("aria-busy", "true");
    await expect(add).toBeDisabled();
    await expectToast(page, "success", tag);
    await expect(add).not.toHaveAttribute("aria-busy");

    page.once("dialog", (d) => d.accept());
    const row = page.locator("div").filter({ hasText: tag }).filter({ has: page.getByRole("button", { name: "Delete label" }) }).last();
    await row.getByRole("button", { name: "Delete label" }).click();
    await expectToast(page, "success", "deleted");
  });
});
