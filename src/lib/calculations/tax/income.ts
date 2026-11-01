import { annual, unavailable } from "./common.ts";
import type { TaxAmount, TaxYear } from "./types.d.ts";

const incomeBands = {
  free: 18_200,
  firstWidth: 26_800,
  secondStart: 45_000,
  secondWidth: 90_000,
  secondRate: 30,
  thirdStart: 135_000,
  thirdWidth: 55_000,
  thirdRate: 37,
  fourthStart: 190_000,
  fourthRate: 45,
};
const lowerRates = { "2025-26": 16, "2026-27": 15 };
const centsPerDollar = 100;
const milliDollarsPerDollar = 1000;
const offset = {
  maximum: 700_000,
  firstEnd: 37_500,
  firstTaper: 50,
  secondEnd: 45_000,
  secondBase: 325_000,
  secondTaper: 15,
  endpoint: 66_667,
};
function basicTax(year: TaxYear, income: number): number {
  return (
    (Math.min(Math.max(0, income - incomeBands.free), incomeBands.firstWidth) * lowerRates[year] +
      Math.min(Math.max(0, income - incomeBands.secondStart), incomeBands.secondWidth) *
        incomeBands.secondRate +
      Math.min(Math.max(0, income - incomeBands.thirdStart), incomeBands.thirdWidth) *
        incomeBands.thirdRate +
      Math.max(0, income - incomeBands.fourthStart) * incomeBands.fourthRate) /
    centsPerDollar
  );
}

function lito(income: number, basic: number): TaxAmount {
  if (income === offset.endpoint) {
    return unavailable("unverified-rule", "R02b: LITO at AUD 66,667 is unresolved.", ["T03"]);
  }
  let milliDollars = 0;
  if (income <= offset.firstEnd) {
    milliDollars = offset.maximum;
  } else if (income <= offset.secondEnd) {
    milliDollars = offset.maximum - (income - offset.firstEnd) * offset.firstTaper;
  } else if (income < offset.endpoint) {
    milliDollars = offset.secondBase - (income - offset.secondEnd) * offset.secondTaper;
  }
  return annual(Math.min(basic, milliDollars / milliDollarsPerDollar), ["T03"]);
}

export { basicTax, lito };
