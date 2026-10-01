import { round2, sum, laborEntryAmount, saleEntryAmount } from "../money";

describe("round2", () => {
  it("fixes classic floating point drift", () => {
    expect(round2(0.1 + 0.2)).toBe(0.3);
  });

  it("rounds half up to 2 decimals", () => {
    expect(round2(10.005)).toBe(10.01);
    expect(round2(10.004)).toBe(10);
  });
});

describe("sum", () => {
  it("sums a list of decimal amounts without drift", () => {
    expect(sum([0.1, 0.2, 0.3])).toBe(0.6);
  });

  it("returns 0 for an empty list", () => {
    expect(sum([])).toBe(0);
  });
});

describe("laborEntryAmount", () => {
  it("multiplies days worked by the daily rate", () => {
    expect(laborEntryAmount(3, 500)).toBe(1500);
  });

  it("handles half days", () => {
    expect(laborEntryAmount(2.5, 400)).toBe(1000);
  });
});

describe("saleEntryAmount", () => {
  it("multiplies quantity by unit price", () => {
    expect(saleEntryAmount(120, 35.5)).toBe(4260);
  });
});
