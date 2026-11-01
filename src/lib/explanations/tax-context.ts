import type { ComparisonResult } from "../calculations/comparison.ts";
import { value } from "../calculations/inputs.ts";
import type { ProfileScenario } from "../calculations/tax/types.d.ts";
import { numeric } from "../data/numeric.ts";
import { offerIncomeRules } from "./tax-income.ts";

const annualNames: Readonly<Record<string, string>> = {
  basicIncomeTax: "basic_income_tax",
  lito: "applied_lito",
  incomeTaxAfterLito: "income_tax_after_lito",
  medicare: "medicare_levy",
  mls: "medicare_levy_surcharge",
  help: "help_repayment",
  rawComponentSubtotal: "annual_component_subtotal",
  finalAssessment: "final_assessed_tax",
  standardDeduction: "standard_deduction",
  derivedTaxableIncome: "derived_taxable_income",
  taxableInput: "taxable_income",
};

const litoLimits = { first: 37_500, second: 45_000, endpoint: 66_667 };
const componentKeys: Readonly<Record<string, readonly string[]>> = {
  basicIncomeTax: ["income", "basicIncomeTax"],
  lito: ["income", "basicIncomeTax", "lito"],
  incomeTaxAfterLito: ["income", "basicIncomeTax", "lito"],
  medicare: ["income", "medicare"],
  mls: ["income", "mls"],
  help: ["income", "help"],
  standardDeduction: ["income"],
  derivedTaxableIncome: ["income"],
  taxableInput: ["income"],
};
const firstRates = { "2025-26": "0.16", "2026-27": "0.15" };
const mlsThresholds = { "2025-26": "101000, 118000, 158000", "2026-27": "105000, 123000, 164000" };
const helpThresholds = {
  "2025-26": "help_lower_threshold = 67000\nhelp_upper_threshold = 125000",
  "2026-27": "help_lower_threshold = 69528\nhelp_upper_threshold = 129717",
};

function deductionRule(result: ComparisonResult, scenario: ProfileScenario): string {
  if (scenario.input.year === "2025-26") {
    return "standard_deduction = 0\nThis deduction does not apply in 2025–26.";
  }
  if (value(result.profile, "standardDeduction") === "no") {
    return "standard_deduction = 0\nStandard-deduction eligibility is set to no.";
  }
  if (value(result.profile, "standardDeduction") !== "yes") {
    return "standard_deduction = unknown\nStandard-deduction eligibility is not established.";
  }
  return "standard_deduction = max(0, min(1000, assessable_labour_income) - specified_work_deductions)";
}

function taxableRule(result: ComparisonResult, withoutOffer: boolean): string {
  let key = "taxableWithOffer";
  if (withoutOffer) {
    key = "taxableWithoutOffer";
  }
  const override = numeric(result.profile, key);
  if (override !== null) {
    if (!withoutOffer && result.tax.withOffer.taxableInput.status === "unavailable") {
      return `taxable_income = unavailable\n${result.tax.withOffer.taxableInput.reason}`;
    }
    return `taxable_income = ${override}`;
  }
  return `taxable_income = floor(round(derived_taxable_income * 100) / 100)
This cents-then-whole-dollar conversion is sal's estimate convention, not verified final-assessment precision.
round means nearest integer, with a half toward positive infinity; floor means round down.`;
}

function incomeFor(
  result: ComparisonResult,
  scenario: ProfileScenario,
  withoutOffer: boolean,
  additionalLeave = false,
): string {
  return `${offerIncomeRules(result, withoutOffer, additionalLeave)}

assessable_income = other_assessable_income + offer_assessable_income
deductions_excluding_standard = other_deductions + offer_deductions
assessable_labour_income = other_assessable_labour_income + offer_assessable_labour_income
specified_work_deductions = other_specified_work_deductions + offer_specified_work_deductions
${deductionRule(result, scenario)}
derived_taxable_income = max(0, assessable_income - deductions_excluding_standard - standard_deduction)
${taxableRule(result, withoutOffer)}
Labour income is a subset of assessable income; specified deductions are a subset of deductions.`;
}

function basicFor(scenario: ProfileScenario): string {
  const rate = firstRates[scenario.input.year];
  return `first_band_rate = ${rate}
basic_income_tax = min(max(0, taxable_income - 18200), 26800) * first_band_rate
  + min(max(0, taxable_income - 45000), 90000) * 0.30
  + min(max(0, taxable_income - 135000), 55000) * 0.37
  + max(0, taxable_income - 190000) * 0.45`;
}

function litoFor(scenario: ProfileScenario): string {
  const income = scenario.input.taxableIncome;
  let entitlement = `lito_entitlement = 700 when taxable_income <= 37500
lito_entitlement = (700000 - (taxable_income - 37500) * 50) / 1000 when 37500 < taxable_income <= 45000
lito_entitlement = (325000 - (taxable_income - 45000) * 15) / 1000 when 45000 < taxable_income < 66667
lito_entitlement = 0 when taxable_income > 66667
At exactly 66667, the offset is unavailable because its endpoint treatment is unresolved.`;
  if (income !== null) {
    if (income <= litoLimits.first) {
      entitlement = "lito_entitlement = 700";
    } else if (income <= litoLimits.second) {
      entitlement = "lito_entitlement = (700000 - (taxable_income - 37500) * 50) / 1000";
    } else if (income < litoLimits.endpoint) {
      entitlement = "lito_entitlement = (325000 - (taxable_income - 45000) * 15) / 1000";
    } else if (income > litoLimits.endpoint) {
      entitlement = "lito_entitlement = 0";
    } else {
      entitlement =
        "lito_entitlement = unavailable\nThe endpoint treatment at 66667 is unresolved.";
    }
  }
  return `${entitlement}
applied_lito = min(basic_income_tax, lito_entitlement)
income_tax_after_lito = basic_income_tax - applied_lito
The applied offset cannot exceed basic income tax. Raw sub-cent precision is retained.`;
}

function medicareFor(scenario: ProfileScenario): string {
  const family = scenario.input.medicare?.family;
  const individual =
    "initial_own_levy = min(taxable_income * 0.02, max(0, taxable_income - 28011) * 0.10)";
  if (family === "single-no-family-reduction") {
    return "medicare_levy = min(taxable_income * 0.02, max(0, taxable_income - 28011) * 0.10)\nNo family reduction applies in this scenario.";
  }
  if (family !== "full-year-spouse") {
    return "medicare_levy = unavailable\nThe Medicare household or exemption treatment is unknown or unsupported.";
  }
  return `${individual}
levy_family_income = taxable_income + spouse_taxable_income
levy_family_threshold = 47238 + 4338 * levy_qualifying_children
medicare_levy = 0 when levy_family_income <= levy_family_threshold

When levy_family_income > levy_family_threshold:
levy_family_reduction = max(0, 0.10 * levy_family_threshold - 0.08 * levy_family_income)
initial_spouse_levy = min(spouse_taxable_income * 0.02, max(0, spouse_taxable_income - 28011) * 0.10)
own_family_reduction = levy_family_reduction when initial_own_levy == 0 or initial_spouse_levy == 0
own_reduction_share = levy_family_reduction * taxable_income / levy_family_income
spouse_reduction_share = levy_family_reduction * spouse_taxable_income / levy_family_income
excess_spouse_reduction = max(0, spouse_reduction_share - initial_spouse_levy)
own_family_reduction = own_reduction_share + excess_spouse_reduction
  when initial_own_levy > 0 and initial_spouse_levy > 0
medicare_levy = max(0, initial_own_levy - own_family_reduction)`;
}

const reportableRules = `reportable_fringe_benefits = other_reportable_fringe_benefits + offer_reportable_fringe_benefits
reportable_super_contributions = other_reportable_super_contributions + offer_reportable_super_contributions`;

function mlsFor(scenario: ProfileScenario): string {
  const { input } = scenario;
  const household = input.mls?.household;
  const thresholds = mlsThresholds[input.year];
  if (!["single", "full-year-spouse", "single-with-dependants"].includes(household ?? "")) {
    return "mls_rate = unknown\nmedicare_levy_surcharge = unavailable\nThe MLS household is unknown or unsupported; the tier cannot be established.";
  }
  let ownIncome = "";
  let spouse = "";
  if (household === "full-year-spouse") {
    ownIncome =
      "mls_individual_test_income = taxable_income + reportable_fringe_benefits + reportable_super_contributions + net_investment_loss\n";
    spouse = "\nWhen mls_individual_test_income <= 28011, mls_rate = 0.";
  }
  let family = "The MLS household is unknown or unsupported; the tier cannot be established.";
  if (household === "single") {
    family =
      "mls_household_test_income = taxable_income + reportable_fringe_benefits + reportable_super_contributions + net_investment_loss\nmls_threshold_multiplier = 1\nmls_child_uplift = 0";
  } else if (household === "full-year-spouse" || household === "single-with-dependants") {
    let householdIncome =
      "taxable_income + reportable_fringe_benefits + reportable_super_contributions + net_investment_loss";
    if (household === "full-year-spouse") {
      householdIncome = "mls_individual_test_income + spouse_mls_test_income";
    }
    family = `mls_household_test_income = ${householdIncome}
mls_threshold_multiplier = 2
mls_child_uplift = max(0, mls_qualifying_children - 1) * 1500`;
  }
  return `${reportableRules}
${ownIncome}${family}
mls_base_thresholds = [${thresholds}]
mls_thresholds = [mls_base_thresholds[0] * mls_threshold_multiplier + mls_child_uplift,
  mls_base_thresholds[1] * mls_threshold_multiplier + mls_child_uplift,
  mls_base_thresholds[2] * mls_threshold_multiplier + mls_child_uplift]
mls_rate = 0, 0.01, 0.0125, 0.015
The rate follows the number of thresholds strictly exceeded by mls_household_test_income.${spouse}
medicare_levy_surcharge = (taxable_income + reportable_fringe_benefits) * mls_rate * mls_liable_days / 365
Liable days range from 0 to 365. Full-year qualifying cover sets zero days; income and household validation still applies.`;
}

function helpFor(scenario: ProfileScenario): string {
  const { help, year } = scenario.input;
  if (help === null) {
    return "help_repayment = unknown\nThe study-loan declaration or scheme is not established.";
  }
  if (help.scheme === "none") {
    return "help_repayment = 0\nNo study loan is declared. Zero applies under supported ordinary resident treatment.";
  }
  if (help.scheme === "other-or-multiple") {
    return "help_repayment = unavailable\nAnnual repayments for this loan arrangement are unsupported.";
  }
  if (help.section8FamilyExemption === true) {
    return "help_repayment = 0\nThe section 8 family exemption applies, subject to ordinary HELP eligibility.";
  }
  const thresholds = helpThresholds[year];
  let family = "No section 8 family exemption applies in this scenario.";
  if (help.section8FamilyExemption === null) {
    family = "The family-exemption status is unknown; the repayment remains unavailable.";
  }
  return `${reportableRules}
help_repayment_income = taxable_income + reportable_fringe_benefits + reportable_super_contributions
  + net_investment_loss + exempt_foreign_employment_income
${thresholds}
help_repayment_before_caps = 0.15 * max(0, min(help_repayment_income, help_upper_threshold) - help_lower_threshold)
  + 0.17 * max(0, help_repayment_income - help_upper_threshold)
help_repayment = min(help_repayment_before_caps, help_repayment_income / 10, help_repayable_debt)
${family}
The debt is the established repayable amount, not an assumed current account balance.`;
}

function medicarePrimary(scenario: ProfileScenario): string {
  const family = scenario.input.medicare?.family;
  if (family === "single-no-family-reduction") {
    return "medicare_levy = min(taxable_income * 0.02, max(0, taxable_income - 28011) * 0.10)";
  }
  if (family === "full-year-spouse") {
    return "medicare_levy = 0 when levy_family_income <= levy_family_threshold\nmedicare_levy = max(0, initial_own_levy - own_family_reduction) otherwise";
  }
  return "medicare_levy = unavailable";
}

function helpPrimary(scenario: ProfileScenario): string {
  const { help } = scenario.input;
  if (help === null || help.scheme === "other-or-multiple") {
    return "help_repayment = unavailable";
  }
  if (help.scheme === "none" || help.section8FamilyExemption === true) {
    return "help_repayment = 0";
  }
  return "help_repayment = min(help_repayment_before_caps, help_repayment_income / 10, help_repayable_debt)";
}

function primaryFormula(
  key: string,
  result: ComparisonResult,
  scenario: ProfileScenario,
  withoutOffer: boolean,
): string {
  const rules: Readonly<Record<string, string>> = {
    basicIncomeTax: basicFor(scenario),
    lito: "applied_lito = min(basic_income_tax, lito_entitlement)",
    incomeTaxAfterLito: "income_tax_after_lito = basic_income_tax - applied_lito",
    medicare: medicarePrimary(scenario),
    mls: "medicare_levy_surcharge = (taxable_income + reportable_fringe_benefits) * mls_rate * mls_liable_days / 365",
    help: helpPrimary(scenario),
    rawComponentSubtotal:
      "annual_component_subtotal = income_tax_after_lito + medicare_levy + medicare_levy_surcharge + help_repayment",
    finalAssessment: "final_assessed_tax = unavailable",
    standardDeduction: deductionRule(result, scenario),
    derivedTaxableIncome:
      "derived_taxable_income = max(0, assessable_income - deductions_excluding_standard - standard_deduction)",
    taxableInput: taxableRule(result, withoutOffer),
  };
  const formula = rules[key];
  if (formula === undefined) {
    throw new Error(`Missing annual equation: ${key}`);
  }
  return formula;
}

export {
  annualNames,
  basicFor,
  componentKeys,
  deductionRule,
  helpFor,
  helpPrimary,
  incomeFor,
  litoFor,
  medicareFor,
  medicarePrimary,
  mlsFor,
  primaryFormula,
  taxableRule,
};
