import { annual, eligibility, inputAmount, unavailable } from "./common.ts";
import type { HelpInput, TaxAmount, TaxYear } from "./types.d.ts";

const thresholds = {
  "2025-26": { lower: 67_000, upper: 125_000 },
  "2026-27": { lower: 69_528, upper: 129_717 },
};
const repayment = { firstPercent: 15, secondPercent: 17, percent: 100, capDivisor: 10 };
function helpRepayment(year: TaxYear, input: HelpInput | null): TaxAmount {
  const sources = ["T12", "T13"];
  if (input === null) {
    return unavailable("missing-input", "Study-loan status is required.", sources);
  }
  if (input.scheme === "none") {
    return annual(0, sources);
  }
  if (input.scheme === "other-or-multiple") {
    return unavailable(
      "unsupported-regime",
      "Other/multiple annual study-loan schemes are not verified.",
      sources,
    );
  }
  const eligible = eligibility(input.ordinaryLiabilityEligible, "Ordinary HELP liability", sources);
  if (eligible.status === "unavailable") {
    return eligible;
  }
  if (input.section8FamilyExemption === null) {
    return unavailable(
      "missing-input",
      "HELP section 8 family exception must be established.",
      sources,
    );
  }
  if (input.section8FamilyExemption) {
    return annual(0, sources);
  }
  const repaymentIncome = inputAmount(input.repaymentIncome, "Established HELP repayment income");
  const debt = inputAmount(
    input.establishedRepayableDebt,
    "Established HELP repayable debt",
    false,
  );
  if (repaymentIncome.status === "unavailable") {
    return repaymentIncome;
  }
  if (debt.status === "unavailable") {
    return debt;
  }
  const income = repaymentIncome.amount;
  const { lower, upper } = thresholds[year];
  const raw =
    (repayment.firstPercent * Math.max(0, Math.min(income, upper) - lower) +
      repayment.secondPercent * Math.max(0, income - upper)) /
    repayment.percent;
  return annual(Math.min(raw, income / repayment.capDivisor, debt.amount), sources);
}

export { helpRepayment };
