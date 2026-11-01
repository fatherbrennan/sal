import { annual, eligibility, inputAmount, unavailable } from "./common.ts";
import type { MlsInput, TaxAmount, TaxYear } from "./types.d.ts";

const sources = ["T08", "T09", "T10", "T11"];
const daysInYear = 365;
const householdRules = { spouseFloor: 28_011, familyMultiplier: 2, childIncrement: 1500 };
const tierBands = {
  "2025-26": [
    { upper: 101_000, rate: 0.01 },
    { upper: 118_000, rate: 0.0125 },
    { upper: 158_000, rate: 0.015 },
  ],
  "2026-27": [
    { upper: 105_000, rate: 0.01 },
    { upper: 123_000, rate: 0.0125 },
    { upper: 164_000, rate: 0.015 },
  ],
};

function tierRate(year: TaxYear, ownIncome: number, input: MlsInput): TaxAmount {
  let tierIncome = ownIncome;
  let multiplier = 1;
  let uplift = 0;
  if (input.household !== "single") {
    const children = inputAmount(input.establishedQualifyingChildren, "MLS qualifying child count");
    if (children.status === "unavailable") {
      return children;
    }
    multiplier = householdRules.familyMultiplier;
    uplift = Math.max(0, children.amount - 1) * householdRules.childIncrement;
  }
  if (input.household === "full-year-spouse") {
    const spouse = inputAmount(input.spouseSurchargeIncome, "Spouse MLS test income");
    if (spouse.status === "unavailable") {
      return spouse;
    }
    if (ownIncome <= householdRules.spouseFloor) {
      return annual(0, sources);
    }
    tierIncome += spouse.amount;
  }
  let rate = 0;
  for (const { upper, rate: bandRate } of tierBands[year]) {
    if (tierIncome > upper * multiplier + uplift) {
      rate = bandRate;
    }
  }
  return annual(rate, sources);
}

function surcharge(year: TaxYear, income: number, input: MlsInput): TaxAmount {
  const fringe = inputAmount(input.reportableFringeBenefits, "Reportable fringe benefits");
  const superAmount = inputAmount(input.reportableSuper, "Reportable super");
  const loss = inputAmount(input.netInvestmentLoss, "Net investment loss");
  const days = inputAmount(input.liableDays, "Established MLS liable days");
  if (fringe.status === "unavailable") {
    return fringe;
  }
  if (superAmount.status === "unavailable") {
    return superAmount;
  }
  if (loss.status === "unavailable") {
    return loss;
  }
  if (days.status === "unavailable") {
    return days;
  }
  if (days.amount > daysInYear) {
    return unavailable("invalid-input", "MLS liable days must be from 0 through 365.", sources);
  }
  const ownIncome = income + fringe.amount + superAmount.amount + loss.amount;
  const rate = tierRate(year, ownIncome, input);
  if (rate.status === "unavailable") {
    return rate;
  }
  return annual(((income + fringe.amount) * rate.amount * days.amount) / daysInYear, sources);
}

function ordinaryMls(year: TaxYear, income: number, input: MlsInput | null): TaxAmount {
  if (input === null || input.household === null) {
    return unavailable("missing-input", "MLS household and income inputs are required.", sources);
  }
  const eligible = eligibility(
    input.ordinarySurchargeEligible,
    "Ordinary MLS eligibility",
    sources,
  );
  if (eligible.status === "unavailable") {
    return eligible;
  }
  if (input.household === "unsupported") {
    return unavailable(
      "unsupported-regime",
      "MLS household changes or special rules unsupported.",
      sources,
    );
  }
  return surcharge(year, income, input);
}

export { ordinaryMls };
