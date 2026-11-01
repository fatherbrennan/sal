import type { ComparisonResult } from "../calculations/comparison.ts";
import { rows, value } from "../calculations/inputs.ts";
import { numeric } from "../data/numeric.ts";

function hasUnsupportedEarnings(result: ComparisonResult): boolean {
  if (result.scenario.baseOnly === true) {
    return false;
  }
  const { target, oneOff } = result.scenario;
  return rows(result.offer, "earnings").some(
    ({ fields }) =>
      (target || value(fields, "certainty") !== "target") &&
      (oneOff || value(fields, "recurrence") !== "once") &&
      value(fields, "taxClass") !== "ordinary",
  );
}

function assessableRule(result: ComparisonResult, expression: string): string {
  if (hasUnsupportedEarnings(result)) {
    return "offer_assessable_income = unavailable\nA selected bonus has unsupported or unknown tax treatment.";
  }
  return `offer_assessable_income = ${expression}`;
}

function contractorRules(result: ComparisonResult, cash: number | null): string {
  const deductions = numeric(result.payer, "businessDeductions");
  let income = assessableRule(result, "annual_cash_pay");
  if (deductions !== null && cash !== null && deductions > cash) {
    income =
      "offer_assessable_income = unavailable\nBusiness deductions exceed revenue excluding GST; this business-loss treatment is unsupported.";
  }
  return `${income}
annual_cash_pay is revenue excluding GST. Business cash expenses and tax deductions are separate.
Offer labour income and deductions use the established business inputs.`;
}

function employeeRules(
  result: ComparisonResult,
  cash: number | null,
  additionalLeave: boolean,
): string {
  const sacrifice = numeric(result.payer, "sacrifice");
  if (sacrifice !== null && cash !== null && sacrifice > cash) {
    return `offer_assessable_income = unavailable
offer_assessable_labour_income = unavailable
Salary sacrifice exceeds the selected cash pay; negative employee income is not calculated.`;
  }
  let income = "annual_cash_pay - annual_salary_sacrifice";
  if (additionalLeave) {
    income += " + annual_leave_entitlement_gross_value";
  }
  return `${assessableRule(result, income)}
offer_assessable_labour_income = ${income}`;
}

function offerIncomeRules(
  result: ComparisonResult,
  withoutOffer: boolean,
  additionalLeave = false,
): string {
  if (withoutOffer) {
    return `offer_assessable_income = 0
offer_assessable_labour_income = 0
offer_deductions = 0
offer_specified_work_deductions = 0
offer_reportable_fringe_benefits = 0
offer_reportable_super_contributions = 0
Shared other income and deductions remain in this scenario.`;
  }
  const cash =
    result.metrics.find(({ label }) => label === "Cash pay / revenue before deductions")?.amount ??
    null;
  const employment = value(result.payer, "employment");
  if (employment === "sole-trader") {
    return contractorRules(result, cash);
  }
  if (employment === "") {
    return "offer_assessable_income = unknown\noffer_assessable_labour_income = unknown\nOffer income treatment is unknown until the employment arrangement is established.";
  }
  return employeeRules(result, cash, additionalLeave);
}

export { offerIncomeRules };
