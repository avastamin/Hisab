import { friendlyDbError } from "../dbErrors";
import { isLabourCategory } from "../labour";
import { safeReturnTo } from "../returnTo";
import { chartRangeFromParam, lastMonths, monthFromParam, monthRange, monthSpan, shiftMonth } from "../format";

describe("safeReturnTo", () => {
  it.each([
    ["/crop-cycles/abc", "/crop-cycles/abc"],
    ["/entries?month=2026-10", "/entries?month=2026-10"],
    ["//evil.example", "/"],
    ["https://evil.example", "/"],
    ["", "/"],
    [null, "/"],
    [42, "/"],
  ])("%s → %s", (input, expected) => {
    expect(safeReturnTo(input)).toBe(expected);
  });
});

describe("month helpers", () => {
  it("shifts across year boundaries", () => {
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-10", 0)).toBe("2026-10");
  });

  it("gives whole-month ranges, leap years included", () => {
    expect(monthRange("2028-02")).toEqual({ start: "2028-02-01", end: "2028-02-29" });
    expect(monthRange("2026-02")).toEqual({ start: "2026-02-01", end: "2026-02-28" });
    expect(monthRange("2026-10")).toEqual({ start: "2026-10-01", end: "2026-10-31" });
  });

  it("accepts a valid month param and falls back to this month otherwise", () => {
    expect(monthFromParam("2026-09")).toBe("2026-09");
    const thisMonth = new Date().toISOString().slice(0, 7);
    for (const bad of [undefined, "2026-13", "2026-9", "abc", ["2026-09"]]) expect(monthFromParam(bad)).toBe(thisMonth);
  });
});

describe("friendlyDbError", () => {
  it("explains rows that are still in use", () => {
    expect(friendlyDbError({ code: "23503", message: "fk" }, "delete the worker")).toBe(
      "Couldn't delete the worker: it's still used by other entries.",
    );
  });

  it("explains duplicates", () => {
    expect(friendlyDbError({ code: "23505", message: "dup" }, "add it")).toMatch(/already exists/);
  });

  it("falls back to the database message", () => {
    expect(friendlyDbError({ message: "network down" }, "save")).toBe("Couldn't save. Please try again. (network down)");
  });
});

describe("isLabourCategory", () => {
  it.each([
    ["Labour", true],
    ["labor", true],
    [" LABOUR ", true],
    ["Labourer", false],
    ["Pesticide", false],
  ])("%s → %s", (name, expected) => {
    expect(isLabourCategory({ name })).toBe(expected);
  });

  it("is false when there's no category", () => {
    expect(isLabourCategory(undefined)).toBe(false);
  });
});

describe("chart ranges", () => {
  it("lists the last N months, oldest first, across years", () => {
    expect(lastMonths(3, "2026-02")).toEqual(["2025-12", "2026-01", "2026-02"]);
    const twelve = lastMonths(12, "2026-10");
    expect(twelve).toHaveLength(12);
    expect(twelve[0]).toBe("2025-11");
    expect(twelve[11]).toBe("2026-10");
    expect(lastMonths(36, "2026-10")[0]).toBe("2023-11");
  });

  it("accepts 12, 24 or 36 and falls back to 12", () => {
    expect(chartRangeFromParam("24")).toBe(24);
    expect(chartRangeFromParam("36")).toBe(36);
    for (const bad of [undefined, "6", "abc", "48", ["24"]]) expect(chartRangeFromParam(bad)).toBe(12);
  });

  it("describes the span", () => {
    expect(monthSpan(lastMonths(12, "2026-10"))).toMatch(/Nov.*2025.*Oct.*2026/);
    expect(monthSpan([])).toBe("");
  });
});
