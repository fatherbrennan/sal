import { annual, inputAmount, rawInputAmount } from "./common.ts";
import type { TaxAmount, TaxFields } from "./types.d.ts";

function answer(fields: TaxFields, key: string): boolean | null {
  if (fields[key] === "yes") {
    return true;
  }
  if (fields[key] === "no") {
    return false;
  }
  return null;
}

function numeric(fields: TaxFields, key: string): number | null {
  const value = fields[key];
  if (value === undefined || value.trim() === "") {
    return null;
  }
  return Number(value);
}

function bothAnswers(first: boolean | null, second: boolean | null): boolean | null {
  if (first === false || second === false) {
    return false;
  }
  if (first === null || second === null) {
    return null;
  }
  return true;
}

function sumInputs(values: readonly (number | null)[], name: string): TaxAmount {
  let total = 0;
  for (const value of values) {
    const checked = rawInputAmount(value, name);
    if (checked.status === "unavailable") {
      return checked;
    }
    total += checked.amount;
  }
  return annual(total, []);
}

function availableNumber(value: TaxAmount): number | null {
  if (value.status === "available") {
    return value.amount;
  }
  return null;
}

function establishedIncome(fields: TaxFields, key: string, derived: TaxAmount): TaxAmount {
  const override = numeric(fields, key);
  if (override !== null) {
    return inputAmount(override, "Established taxable-income override");
  }
  if (derived.status === "unavailable") {
    return derived;
  }
  const centsPerDollar = 100;
  const estimated = Math.floor(Math.round(derived.amount * centsPerDollar) / centsPerDollar);
  return inputAmount(estimated, "Estimated whole-dollar taxable income");
}

export { answer, availableNumber, bothAnswers, establishedIncome, numeric, sumInputs };
