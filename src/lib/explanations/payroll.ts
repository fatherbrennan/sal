import type { ComparisonResult } from "../calculations/comparison.ts";
import { value } from "../calculations/inputs.ts";
import { payrollPeriodConversions } from "../calculations/tax/payroll.ts";
import type { PayrollHourlyResult, PayrollResult } from "../calculations/tax/payroll-types.d.ts";
import type { PaygRulePeriod, TaxAmount } from "../calculations/tax/types.d.ts";
import { numeric } from "../data/numeric.ts";
import { basePaySection } from "./base-pay.ts";
import { type Equation, type EquationSection, type EquationValue, explanation } from "./model.ts";
import { paySections } from "./pay-sections.ts";
import { paygTables } from "./payg.ts";
import { taxNotes, taxValue } from "./tax.ts";
import { paygRulesFor, periodPaygFormula } from "./tax-rules.ts";

interface PayrollContext {
  result: ComparisonResult;
  payroll: PayrollResult;
  hourly: PayrollHourlyResult;
}
const payrollNames: Readonly<Record<string, string>> = {
  grossBaseCash: "period_gross_cash_pay",
  salarySacrifice: "period_salary_sacrifice",
  taxablePay: "period_payg_earnings",
  personalSuper: "period_personal_super_contribution",
  otherDeductions: "period_other_post_tax_deductions",
  ordinary: "period_ordinary_payg",
  loanIncrement: "period_study_loan_withholding",
  combined: "period_total_payg",
  cash: "period_cash_after_withholding",
  bankEstimate: "period_bank_cash_estimate",
};
const payrollFormulas: Readonly<Record<string, string>> = {
  grossBaseCash:
    "period_gross_cash_pay = round(annual_base_cash * 100 / representative_periods_per_year) / 100",
  salarySacrifice: "period_salary_sacrifice",
  taxablePay:
    "period_payg_earnings = (round(period_gross_cash_pay * 100) - round(period_salary_sacrifice * 100)) / 100",
  personalSuper: "period_personal_super_contribution",
  otherDeductions: "period_other_post_tax_deductions",
  ordinary: "period_ordinary_payg",
  loanIncrement: "period_study_loan_withholding = period_total_payg - period_ordinary_payg",
  combined: "period_total_payg",
  cash: "period_cash_after_withholding = (round(period_payg_earnings * 100) - round(period_total_payg * 100)) / 100",
  bankEstimate:
    "period_bank_cash_estimate = (round(period_cash_after_withholding * 100) - round(period_personal_super_contribution * 100) - round(period_other_post_tax_deductions * 100)) / 100",
};
const ruleDates = {
  "2025-july": "1 July–23 September 2025",
  "2025-september": "24 September 2025–30 June 2026",
  "2026-july": "1 July 2026–30 June 2027",
};
const periodCashRules = `period_gross_cash_pay = round(annual_base_cash * 100 / representative_periods_per_year) / 100
period_payg_earnings = (round(period_gross_cash_pay * 100) - round(period_salary_sacrifice * 100)) / 100
period_cash_after_withholding = (round(period_payg_earnings * 100) - round(period_total_payg * 100)) / 100
period_bank_cash_estimate = (round(period_cash_after_withholding * 100) - round(period_personal_super_contribution * 100)
  - round(period_other_post_tax_deductions * 100)) / 100
Only valid salary sacrifice reduces withholding earnings. Personal super and other deductions are after tax.
Personal contributions are not automatically payroll deductions. Unknown outflows remain unknown.
round means nearest integer, with a half toward positive infinity.`;
const hourlyRules = `standard_paid_hours_per_year = standard_paid_hours_per_week * standard_weeks_per_year
allocated_period_paid_hours = standard_paid_hours_per_year / representative_periods_per_year
Hours and weeks must be positive and finite. These are allocated paid hours, not actual period attendance.`;

function payrollValues(
  { result, payroll, hourly }: PayrollContext,
  period: PaygRulePeriod | null,
): Record<string, EquationValue> {
  let annualBaseCash = result.baseCash;
  if (value(result.payer, "employment") === "sole-trader") {
    annualBaseCash = null;
  }
  const values: Record<string, EquationValue> = {
    annualBaseCash,
    annualSalarySacrifice: numeric(result.payer, "sacrifice"),
    standardPaidHoursPerWeek: numeric(result.payer, "weeklyHours"),
    standardWeeksPerYear: numeric(result.payer, "weeks"),
    allocatedPeriodPaidHours: hourly.allocatedPeriodHours,
  };
  if (payroll.period !== null) {
    Object.assign(values, {
      representativePeriodsPerYear: payrollPeriodConversions[payroll.period],
    });
  }
  for (const [key, amount] of Object.entries(payroll)) {
    const name = payrollNames[key];
    if (name !== undefined && typeof amount === "object" && amount !== null && "status" in amount) {
      values[name] = taxValue(amount);
    }
  }
  const selected = payroll.rulePeriods.find((entry) => entry.rulePeriod === period);
  if (selected !== undefined) {
    Object.assign(values, {
      periodOrdinaryPayg: taxValue(selected.withholding.ordinary),
      periodTotalPayg: taxValue(selected.withholding.combined),
      periodStudyLoanWithholding: taxValue(selected.withholding.loanIncrement),
      periodCashAfterWithholding: taxValue(selected.cashAfterWithholding),
      periodBankCashEstimate: taxValue(selected.bankEstimate),
    });
  }
  return values;
}

const payrollOrigins = Object.fromEntries([
  [
    "annual_base_cash",
    "Established employee base cash for representative payroll; unavailable for sole-trader fees.",
  ],
  [
    "period_salary_sacrifice",
    "Effective valid period salary sacrifice to super: explicit override or standard annual conversion.",
  ],
  [
    "period_personal_super_contribution",
    "Effective after-tax payroll contribution; not derived from annual personal super.",
  ],
  [
    "period_other_post_tax_deductions",
    "Effective other after-tax period outflows, not necessarily lost value.",
  ],
  [
    "representative_periods_per_year",
    "sal divisor: weekly 52, fortnightly 26, monthly 12, quarterly 4; not actual deposit counts.",
  ],
  ["standard_paid_hours_per_week", "Effective offer weekly standard paid-hours input."],
  ["standard_weeks_per_year", "Effective editable standard paid-weeks conversion input."],
  ["annual_salary_sacrifice", "Effective annual salary sacrifice to super for this offer."],
]);
const payrollUnits = Object.fromEntries(
  [
    ...Object.values(payrollNames),
    ...Object.values(payrollNames).map((name) => `${name}_per_hour`),
    "annual_base_cash",
    "annual_salary_sacrifice",
  ].map((name) => [name, "money"]),
);

function sacrificeFormula(result: ComparisonResult): string {
  if (
    value(result.payer, "estimateMode") === "standard" &&
    !Object.hasOwn(result.offer.fields, "periodSacrifice") &&
    value(result.payer, "regularPay") === "yes" &&
    value(result.payer, "employment") !== "" &&
    value(result.payer, "employment") !== "sole-trader"
  ) {
    return "\nperiod_salary_sacrifice = round(annual_salary_sacrifice * 100 / representative_periods_per_year) / 100";
  }
  return "";
}

function payrollSections(
  context: PayrollContext,
  period: PaygRulePeriod | null,
): EquationSection[] {
  const { result, payroll } = context;
  const sections = paySections(result, result.tax.withOffer.input.year);
  if (!["sole-trader", ""].includes(value(result.payer, "employment"))) {
    sections.push(basePaySection(result, result.tax.withOffer.input.year));
  }
  sections.push({
    title: "Period pay and deductions",
    formula: periodCashRulesFor(period) + sacrificeFormula(result),
    notes: payroll.sourceNotes,
  });
  if (period !== null) {
    const loan = value(result.profile, "studyLoan");
    sections.push(
      {
        title: `PAYG calculation · ${ruleDates[period]}`,
        formula: paygRulesFor(payroll.period, loan, period, value(result.payer, "threshold")),
      },
      {
        title: "Selected PAYG coefficient tables",
        formula: paygTables(period, value(result.payer, "threshold"), loan),
      },
    );
  }
  return sections.map((section) => ({
    ...section,
    values: {
      ...explanation(section.title, section.formula, payrollValues(context, period)).values,
      ...section.values,
    },
    origins: { ...payrollOrigins, ...section.origins },
    units: { ...payrollUnits, ...section.units },
  }));
}

function periodCashRulesFor(period: PaygRulePeriod | null): string {
  if (period === null) {
    return periodCashRules
      .split("\n")
      .filter(
        (line) =>
          !(
            line.includes("period_total_payg") ||
            line.startsWith("period_bank_cash_estimate") ||
            line.startsWith("  - round(period_other_post_tax_deductions")
          ),
      )
      .join("\n");
  }
  return periodCashRules;
}

function payrollEquation(
  key: string,
  amount: TaxAmount,
  context: PayrollContext,
  { period = null, perHour = false }: { period?: PaygRulePeriod | null; perHour?: boolean } = {},
): Equation {
  const variable = payrollNames[key];
  let formula = payrollFormulas[key];
  if (variable === undefined || formula === undefined) {
    throw new Error(`Missing payroll equation: ${key}`);
  }
  const { result, payroll } = context;
  if (
    ["salarySacrifice", "personalSuper", "otherDeductions"].includes(key) &&
    amount.status === "available" &&
    !perHour
  ) {
    formula = `${variable} = ${amount.amount}`;
  }
  if (payroll.period !== null && (key === "ordinary" || key === "combined")) {
    let role: "ordinary" | "total" = "ordinary";
    if (key === "combined") {
      role = "total";
    }
    formula = periodPaygFormula(payroll.period, role);
  }
  if (key === "combined" && value(result.profile, "studyLoan") === "no") {
    formula = "period_total_payg = period_ordinary_payg";
  }
  const sections = payrollSections(context, period);
  let output = variable;
  if (perHour) {
    output = `${variable}_per_hour`;
    formula = `${output} = ${variable} / allocated_period_paid_hours`;
    sections.push({
      title: "Paid-hours allocation",
      formula: hourlyRules,
      values: explanation("", hourlyRules, payrollValues(context, period)).values,
    });
  }
  const warnings: string[] = [];
  if (amount.status === "unavailable") {
    formula = `${output} = unavailable`;
    warnings.push(`Unavailable (${amount.code}): ${amount.reason}`);
  }
  let timing = "Base inputs";
  if (period !== null) {
    timing = ruleDates[period];
  }
  return {
    ...explanation(`Representative ${payroll.period ?? "unknown"} pay · ${timing}`, formula, {
      ...payrollValues(context, period),
      displayedResult: taxValue(amount),
    }),
    context:
      "Representative base-pay estimate. Withholding is separate from annual tax and does not predict actual deposits.",
    result: { name: output, value: taxValue(amount), unit: "money" },
    origins: payrollOrigins,
    units: payrollUnits,
    warnings,
    sections: [
      ...sections,
      { title: "Result basis and sources", formula: "", notes: taxNotes(amount) },
    ],
  };
}

function allocatedHoursEquation(context: PayrollContext): Equation {
  const warnings: string[] = [];
  if (context.hourly.allocatedPeriodHours === null) {
    warnings.push(
      "A supported pay frequency and positive finite weekly hours and conversion weeks are required.",
    );
  }
  return {
    ...explanation(
      "Representative paid-hours allocation",
      "allocated_period_paid_hours = standard_paid_hours_per_year / representative_periods_per_year",
      { ...payrollValues(context, null), displayedResult: context.hourly.allocatedPeriodHours },
    ),
    context: "Standard paid hours allocated to one representative period, not actual attendance.",
    result: {
      name: "allocated_period_paid_hours",
      value: context.hourly.allocatedPeriodHours,
      unit: "number",
    },
    warnings,
    origins: payrollOrigins,
    sections: [
      {
        title: "Paid-hours calculation",
        formula: hourlyRules,
        values: explanation("", hourlyRules, payrollValues(context, null)).values,
      },
    ],
  };
}

export type { PayrollContext };
export { allocatedHoursEquation, payrollEquation, payrollNames, ruleDates };
