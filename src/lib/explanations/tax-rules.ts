import type { ComparisonResult } from "../calculations/comparison.ts";
import { value } from "../calculations/inputs.ts";
import type { PaygRulePeriod, PayPeriod } from "../calculations/tax/types.d.ts";
import { numeric } from "../data/numeric.ts";

const assessmentRules = `annual_component_subtotal = income_tax_after_lito + medicare_levy
  + medicare_levy_surcharge + help_repayment
These are raw component estimates for supported ordinary resident-adult circumstances.
Final assessed tax is unavailable because final precision and assessment composition are not verified.
Unverified special assessment items block the complete component subtotal.`;

const attributionRules =
  "offer_attributed_annual_tax_estimate = annual_component_subtotal_with_offer - annual_component_subtotal_without_offer";

const taxUnits = Object.fromEntries(
  [
    "basic_income_tax",
    "applied_lito",
    "income_tax_after_lito",
    "medicare_levy",
    "medicare_levy_surcharge",
    "help_repayment",
    "annual_component_subtotal",
    "final_assessed_tax",
    "standard_deduction",
    "derived_taxable_income",
    "taxable_income",
    "annual_cash_pay",
    "annual_salary_sacrifice",
    "offer_deductions",
    "offer_specified_work_deductions",
    "offer_assessable_labour_income",
    "other_assessable_income",
    "other_deductions",
    "other_assessable_labour_income",
    "other_specified_work_deductions",
    "other_reportable_fringe_benefits",
    "other_reportable_super_contributions",
    "offer_reportable_fringe_benefits",
    "offer_reportable_super_contributions",
    "spouse_taxable_income",
    "spouse_mls_test_income",
    "net_investment_loss",
    "exempt_foreign_employment_income",
    "help_repayable_debt",
    "help_repayment_income",
    "offer_attributed_annual_tax_estimate",
  ].map((name) => [name, "money"]),
);

const annualInputOrigins = Object.fromEntries([
  ["annual_salary_sacrifice", "Effective offer salary sacrifice to super for the selected year."],
  [
    "offer_assessable_labour_income",
    "Eligible labour-income subset: employee cash after sacrifice or established contractor labour amount.",
  ],
  ["other_assessable_income", "Effective profile assessable income outside this offer."],
  ["other_deductions", "Deductions outside this offer, excluding the standard deduction."],
  ["other_assessable_labour_income", "Eligible labour-income subset of other assessable income."],
  ["other_specified_work_deductions", "Specified-work subset of other deductions."],
  ["other_reportable_fringe_benefits", "Effective reportable fringe benefits outside this offer."],
  ["other_reportable_super_contributions", "Reportable super outside this offer, not all super."],
  [
    "offer_reportable_fringe_benefits",
    "This offer's established reportable fringe benefits, separate from personal perk values.",
  ],
  [
    "offer_reportable_super_contributions",
    "This offer's selected-year reportable super; standard mode may derive it from salary sacrifice.",
  ],
  ["spouse_taxable_income", "Established spouse taxable income for levy family treatment."],
  ["spouse_mls_test_income", "Established spouse MLS test income, distinct from taxable income."],
  ["levy_qualifying_children", "Established Medicare levy qualifying-child count."],
  ["mls_qualifying_children", "Established MLS qualifying-child count, independently supplied."],
  ["mls_liable_days", "Established MLS liable days; full-year qualifying cover sets zero."],
  ["net_investment_loss", "Effective profile net investment loss used in income tests."],
  ["exempt_foreign_employment_income", "Effective exempt foreign employment income for HELP."],
  ["help_repayable_debt", "Established HELP repayable debt, not an assumed account balance."],
]);

function annualOrigins(result: ComparisonResult, withoutOffer: boolean): Record<string, string> {
  let deductions = "Effective employee work-deduction inputs in the tax profile.";
  if (value(result.payer, "employment") === "sole-trader") {
    deductions = "Established business deduction inputs for this sole-trader offer.";
  }
  let taxable = "Whole-dollar taxable income produced by sal's stated estimate conversion.";
  let override = "taxableWithOffer";
  if (withoutOffer) {
    override = "taxableWithoutOffer";
  }
  if (numeric(result.profile, override) !== null) {
    taxable = `Established whole-dollar taxable-income override: ${override}.`;
  }
  const origins = {
    ...annualInputOrigins,
    ...Object.fromEntries([
      ["taxable_income", taxable],
      ["offer_deductions", deductions],
      [
        "offer_specified_work_deductions",
        `${deductions} Specified-work subset, not an additional deduction.`,
      ],
    ]),
  };
  if (withoutOffer) {
    for (const key of Object.keys(origins)) {
      if (key.startsWith("offer_")) {
        origins[key] = "Removed in the without-offer counterfactual; this offer contributes zero.";
      }
    }
  }
  return origins;
}

const weeklyConversions = {
  weekly: "payg_weekly_earnings_cents = floor(period_payg_earnings_cents / 100) * 100 + 99",
  fortnightly: "payg_weekly_earnings_cents = floor(period_payg_earnings_cents / 200) * 100 + 99",
  monthly: `monthly_adjusted_payg_earnings_cents = period_payg_earnings_cents + 1 when period_payg_earnings_cents % 100 = 33
monthly_adjusted_payg_earnings_cents = period_payg_earnings_cents otherwise
payg_weekly_earnings_cents = floor(monthly_adjusted_payg_earnings_cents * 3 / 1300) * 100 + 99`,
  quarterly: "payg_weekly_earnings_cents = floor(period_payg_earnings_cents / 1300) * 100 + 99",
};

function periodPaygFormula(period: PayPeriod, role: "ordinary" | "total"): string {
  const raw = `${role}_payg_raw_weekly_millionths`;
  const weekly = `${role}_payg_weekly_withholding`;
  const rounded = `floor((${raw} + 500000) / 1000000)`;
  const conversions = {
    weekly: `period_${role}_payg = ${rounded}`,
    fortnightly: `period_${role}_payg = ${weekly} * 2`,
    monthly: `period_${role}_payg = floor(${weekly} * 13 / 3 + 0.5)`,
    quarterly: `period_${role}_payg = ${weekly} * 13`,
  };
  return conversions[period];
}

function withholdingRules(period: PayPeriod, role: "ordinary" | "total"): string {
  const raw = `${role}_payg_raw_weekly_millionths`;
  let weekly = "";
  if (period !== "weekly") {
    weekly = `${role}_payg_weekly_withholding = floor((${raw} + 500000) / 1000000)\n`;
  }
  return `${raw} = round(${role}_payg_coefficient_multiplier * 10000) * payg_weekly_earnings_cents
  - round(${role}_payg_coefficient_offset * 10000) * 100
${weekly}${periodPaygFormula(period, role)}`;
}

function paygRulesFor(
  period: PayPeriod | null,
  loan: string,
  rulePeriod: PaygRulePeriod,
  threshold: string,
): string {
  if (period === null) {
    return "period_ordinary_payg = unknown\nperiod_total_payg = unknown\nperiod_study_loan_withholding = unknown\nThe representative pay frequency is unknown; its PAYG conversion is unavailable.";
  }
  if (threshold !== "yes" && threshold !== "no") {
    return "period_ordinary_payg = unknown\nperiod_total_payg = unknown\nperiod_study_loan_withholding = unknown\nThe payer tax-free-threshold declaration is unknown.";
  }
  let combined =
    "period_total_payg = unknown\nThe study-loan declaration is unknown; total withholding is unavailable.";
  if (loan === "yes") {
    combined = withholdingRules(period, "total");
    if (rulePeriod === "2025-july" && threshold === "no") {
      combined =
        "period_total_payg = unavailable\nThe early 2025 no-threshold combined-loan coefficients are unverified.";
    }
  } else if (loan === "no") {
    combined = "period_total_payg = period_ordinary_payg";
  }
  return `period_payg_earnings_cents = round(period_payg_earnings * 100)
${weeklyConversions[period]}
The first coefficient band whose upper boundary exceeds payg_weekly_earnings_cents applies; otherwise the top band applies.
${withholdingRules(period, "ordinary")}
${combined}
period_study_loan_withholding = period_total_payg - period_ordinary_payg
round means nearest integer, with a half toward positive infinity; floor means round down.
Weekly withholding is rounded directly to whole dollars, without preliminary cent rounding.`;
}

export {
  annualOrigins,
  assessmentRules,
  attributionRules,
  paygRulesFor,
  periodPaygFormula,
  taxUnits,
};
