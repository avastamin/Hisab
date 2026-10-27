import { addDates, datesInRange, parseWorkDates, sharedDates, toggleDate } from "../workDates";
import { WORKER_COLORS, nextWorkerColor, parseWorkerColor, workerColor } from "../workerColors";

describe("work dates", () => {
  it("toggles a date in and out, keeping the list sorted", () => {
    const added = toggleDate(["2026-10-05", "2026-10-01"], "2026-10-03");
    expect(added).toEqual(["2026-10-01", "2026-10-03", "2026-10-05"]);
    expect(toggleDate(added, "2026-10-03")).toEqual(["2026-10-01", "2026-10-05"]);
  });

  it("adds dates without duplicates", () => {
    expect(addDates(["2026-10-02"], ["2026-10-01", "2026-10-02"])).toEqual(["2026-10-01", "2026-10-02"]);
  });

  it("expands a selection with an exclusive end, across a month boundary", () => {
    expect(datesInRange("2026-10-30", "2026-11-02")).toEqual(["2026-10-30", "2026-10-31", "2026-11-01"]);
    expect(datesInRange("2026-10-30", "2026-10-30")).toEqual([]);
  });

  it("parses the form field, dropping anything that isn't a date", () => {
    expect(parseWorkDates("2026-10-02, 2026-10-01,,nope,2026-10-02")).toEqual(["2026-10-01", "2026-10-02"]);
    expect(parseWorkDates(null)).toEqual([]);
  });

  it("finds shared dates", () => {
    expect(sharedDates(["2026-10-01", "2026-10-02"], ["2026-10-02", "2026-10-09"])).toEqual(["2026-10-02"]);
  });
});

describe("worker colours", () => {
  it("uses the chosen colour, or a stable one from the id", () => {
    expect(workerColor({ id: "a", color: "#123456" })).toBe("#123456");
    expect(workerColor({ id: "abc" })).toBe(workerColor({ id: "abc" }));
    expect(WORKER_COLORS.map((c) => c.value)).toContain(workerColor({ id: "abc", color: "not a colour" }));
  });

  it("gives a new worker a colour nobody uses yet", () => {
    const taken = WORKER_COLORS.slice(0, 3).map((c, i) => ({ id: String(i), color: c.value }));
    expect(nextWorkerColor(taken)).toBe(WORKER_COLORS[3].value);
  });

  it("only accepts palette colours from forms", () => {
    expect(parseWorkerColor(WORKER_COLORS[0].value)).toBe(WORKER_COLORS[0].value);
    expect(parseWorkerColor("#000000")).toBeNull();
  });
});
