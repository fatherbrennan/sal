import { annual, eligibility, rawInputAmount } from "./common.ts";
import type { StandardDeductionInput, TaxAmount } from "./types.d.ts";

const maximumStandardDeduction = 1000;
function calculateStandardDeduction(input: StandardDeductionInput): TaxAmount {
  const sources = ["T02", "T07"];
  if (input.year === "2025-26" || input.eligible === false) {
    return annual(0, sources);
  }
  const eligible = eligibility(input.eligible, "Standard work deduction eligibility", sources);
  if (eligible.status === "unavailable") {
    return eligible;
  }
  const income = rawInputAmount(input.assessableLabourIncome, "Statutory assessable labour income");
  const deductions = rawInputAmount(input.specifiedDeductions, "Specified work deductions");
  if (income.status === "unavailable") {
    return income;
  }
  if (deductions.status === "unavailable") {
    return deductions;
  }
  return annual(
    Math.max(0, Math.min(maximumStandardDeduction, income.amount) - deductions.amount),
    sources,
  );
}

export { calculateStandardDeduction };
