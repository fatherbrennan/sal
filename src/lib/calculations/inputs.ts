import type { Fields, Item, SalRecord } from "../data/model.d.ts";
import { numeric } from "../data/numeric.ts";

function value(fields: Fields, key: string): string {
  return fields[key] ?? "";
}
function rows(record: SalRecord, key: string): readonly Item[] {
  return record.items[key] ?? [];
}
function total(values: readonly (number | null)[]): number | null {
  let result = 0;
  for (const amount of values) {
    if (amount === null) {
      return null;
    }
    result += amount;
  }
  return result;
}
function difference(left: number | null, right: number | null): number | null {
  if (left === null || right === null) {
    return null;
  }
  return left - right;
}
function product(left: number | null, right: number | null): number | null {
  if (left === null || right === null) {
    return null;
  }
  return left * right;
}
function quotient(amount: number | null, divisor: number | null): number | null {
  if (amount === null || divisor === null || divisor <= 0) {
    return null;
  }
  const result = amount / divisor;
  if (!Number.isFinite(result)) {
    return null;
  }
  return result;
}
function inherited(offer: Fields, shared: Fields, key: string): number | null {
  if (Object.hasOwn(offer, key)) {
    return numeric(offer, key);
  }
  return numeric(shared, key);
}

function percentage(amount: number | null, base: number | null): number | null {
  const percentScale = 100;
  return product(quotient(amount, base), percentScale);
}

export { difference, inherited, percentage, product, quotient, rows, total, value };
