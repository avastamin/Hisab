/** Rounds to 2 decimal places, avoiding common floating point artifacts (e.g. 0.1 + 0.2). */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function sum(values: readonly number[]): number {
  return round2(values.reduce((total, value) => total + value, 0));
}

export function laborEntryAmount(daysWorked: number, dailyRate: number): number {
  return round2(daysWorked * dailyRate);
}

export function saleEntryAmount(quantity: number, unitPrice: number): number {
  return round2(quantity * unitPrice);
}
