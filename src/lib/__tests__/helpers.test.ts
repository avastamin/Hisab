import { friendlyDbError } from "../dbErrors";
import { isLabourCategory } from "../labour";
import { safeReturnTo } from "../returnTo";
import {
  chartPeriodFromParams,
  chartRangeFromParam,
  lastMonths,
  monthFromParam,
  monthRange,
  monthSpan,
  monthsBetween,
  shiftMonth,
  today,
} from "../format";

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

  it("accepts 1, 3, 6 or 12 and falls back to 12", () => {
    for (const n of [1, 3, 6, 12]) expect(chartRangeFromParam(String(n))).toBe(n);
    for (const bad of [undefined, "24", "abc", "48", ["6"]]) expect(chartRangeFromParam(bad)).toBe(12);
  });

  it("covers whole months for a preset", () => {
    const thisMonth = today().slice(0, 7);
    const one = chartPeriodFromParams({ range: "1" });
    expect(one.months).toEqual([thisMonth]);
    expect(one.start).toBe(`${thisMonth}-01`);
    expect(chartPeriodFromParams({ range: "3" }).months).toHaveLength(3);
  });

  it("uses the exact days of a custom range, swapping a backwards one", () => {
    const period = chartPeriodFromParams({ range: "custom", from: "2026-03-15", to: "2026-01-10" });
    expect(period).toEqual({ range: "custom", start: "2026-01-10", end: "2026-03-15", months: ["2026-01", "2026-02", "2026-03"] });
  });

  it("ignores invalid custom dates and caps very long ranges", () => {
    const bad = chartPeriodFromParams({ range: "custom", from: "2026-02-31", to: "nope" });
    expect(bad.end).toBe(today());
    expect(bad.months).toHaveLength(12);
    const long = chartPeriodFromParams({ range: "custom", from: "1990-01-01", to: "2026-10-27" });
    expect(long.months).toHaveLength(120);
    expect(long.start).toBe(`${long.months[0]}-01`);
  });

  it("lists the months between two months", () => {
    expect(monthsBetween("2025-11", "2026-02")).toEqual(["2025-11", "2025-12", "2026-01", "2026-02"]);
  });

  it("describes the span", () => {
    expect(monthSpan(lastMonths(12, "2026-10"))).toMatch(/Nov.*2025.*Oct.*2026/);
    expect(monthSpan([])).toBe("");
  });
});
