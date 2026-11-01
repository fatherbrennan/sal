import { annual, eligibility, inputAmount, unavailable } from "./common.ts";
import type { MedicareInput, TaxAmount } from "./types.d.ts";

const levy = {
  rate: 2,
  phaseIn: 10,
  singleThreshold: 28_011,
  familyThreshold: 47_238,
  childIncrement: 4338,
  reductionTaper: 8,
  percent: 100,
};
function individualLevy(income: number): number {
  return (
    Math.min(income * levy.rate, Math.max(0, income - levy.singleThreshold) * levy.phaseIn) /
    levy.percent
  );
}

function ordinaryMedicare(income: number, input: MedicareInput | null): TaxAmount {
  const sources = ["T08", "T09"];
  if (input === null || input.family === null) {
    return unavailable("missing-input", "Medicare treatment is required.", sources);
  }
  const eligible = eligibility(input.ordinaryLevyEligible, "Ordinary levy eligibility", sources);
  if (eligible.status === "unavailable") {
    return eligible;
  }
  const ownLevy = individualLevy(income);
  if (input.family === "single-no-family-reduction") {
    return annual(ownLevy, sources);
  }
  if (input.family === "unsupported") {
    return unavailable(
      "unsupported-regime",
      "Medicare household/exemption branch unsupported.",
      sources,
    );
  }
  const spouse = inputAmount(input.spouseTaxableIncome, "Spouse taxable income");
  const children = inputAmount(input.establishedQualifyingChildren, "Levy qualifying child count");
  if (spouse.status === "unavailable") {
    return spouse;
  }
  if (children.status === "unavailable") {
    return children;
  }
  const familyIncome = income + spouse.amount;
  const threshold = levy.familyThreshold + levy.childIncrement * children.amount;
  if (familyIncome <= threshold) {
    return annual(0, sources);
  }
  const reduction =
    Math.max(0, levy.phaseIn * threshold - levy.reductionTaper * familyIncome) / levy.percent;
  const spouseLevy = individualLevy(spouse.amount);
  if (ownLevy === 0 || spouseLevy === 0) {
    return annual(Math.max(0, ownLevy - reduction), sources);
  }
  const ownShare = (reduction * income) / familyIncome;
  const spouseShare = (reduction * spouse.amount) / familyIncome;
  return annual(Math.max(0, ownLevy - ownShare - Math.max(0, spouseShare - spouseLevy)), sources);
}

export { ordinaryMedicare };
