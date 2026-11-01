import { eligibility, inputAmount, rawInputAmount, unavailable } from "./common.ts";
import { calculatePayg } from "./payg.ts";
import type { PayrollInput, PayrollResult, PayrollRuleResult } from "./payroll-types.d.ts";
import { buildPaygInput } from "./profile.ts";
import { answer, availableNumber, numeric } from "./profile-inputs.ts";
import { TAX_RULE_VERSION } from "./sources.ts";
import type { PaygResult, PaygRulePeriod, PayPeriod, TaxAmount, TaxFields } from "./types.d.ts";

const centsPerDollar = 100;
const payrollPeriodConversions = { weekly: 52, fortnightly: 26, monthly: 12, quarterly: 4 };
const conversionNote =
  "sal representative estimate: annual base cash divided by 52, 26, 12 or 4 for weekly, fortnightly, monthly or quarterly pay, rounded to the nearest cent. This does not predict annual deposit counts or actual payslip rounding.";
const sourceNotes = [
  "T53: only established valid salary sacrifice is removed before PAYG. Personal super and other post-tax payroll deductions do not reduce these payroll earnings.",
  "T33/T34/T22: PAYG uses the selected rule period's published formulas and rounding after the salary-to-period estimate. Bonuses, irregular pay and special payroll adjustments are outside this base-pay result.",
];

function periodFrom(fields: TaxFields): PayPeriod | null {
  const { payFrequency } = fields;
  if (
    payFrequency === "weekly" ||
    payFrequency === "fortnightly" ||
    payFrequency === "monthly" ||
    payFrequency === "quarterly"
  ) {
    return payFrequency;
  }
  return null;
}

function payrollAmount(amount: number, sources: readonly string[] = []): TaxAmount {
  return { status: "available", amount, basis: "representative payroll estimate", sources };
}

function grossPay(input: PayrollInput, period: PayPeriod | null): TaxAmount {
  const { employment } = input.payer;
  if (employment === "sole-trader") {
    return unavailable(
      "unsupported-regime",
      "Sole-trader fees require their own withholding treatment.",
      ["T24"],
    );
  }
  if (period === null) {
    return unavailable(
      "missing-input",
      "A supported representative pay frequency is required.",
      [],
    );
  }
  const equalPay = eligibility(
    answer(input.payer, "regularPay"),
    "Equal ordinary base-pay periods",
    [],
  );
  if (equalPay.status === "unavailable") {
    return equalPay;
  }
  const annual = rawInputAmount(input.annualBaseCash, "Annual base cash before salary sacrifice");
  if (annual.status === "unavailable") {
    return annual;
  }
  return payrollAmount(
    Math.round((annual.amount * centsPerDollar) / payrollPeriodConversions[period]) /
      centsPerDollar,
  );
}

function deduction(fields: TaxFields, key: string, label: string): TaxAmount {
  const checked = inputAmount(numeric(fields, key), label, false);
  if (checked.status === "unavailable") {
    return checked;
  }
  return payrollAmount(checked.amount, ["T53"]);
}

function remainingCash(start: TaxAmount, outflows: readonly TaxAmount[], label: string): TaxAmount {
  if (start.status === "unavailable") {
    return start;
  }
  let cents = Math.round(start.amount * centsPerDollar);
  const sources = [...start.sources];
  for (const outflow of outflows) {
    if (outflow.status === "unavailable") {
      return outflow;
    }
    cents -= Math.round(outflow.amount * centsPerDollar);
    sources.push(...outflow.sources);
  }
  if (cents < 0) {
    return unavailable(
      "invalid-input",
      `${label} outflows exceed the available period cash.`,
      sources,
    );
  }
  return payrollAmount(cents / centsPerDollar, sources);
}

function withholding(
  input: PayrollInput,
  period: PayPeriod | null,
  rulePeriod: PaygRulePeriod,
  taxablePay: TaxAmount,
): PaygResult {
  if (taxablePay.status === "unavailable" || period === null) {
    return {
      ordinary: taxablePay,
      combined: taxablePay,
      loanIncrement: taxablePay,
      method: "published combined coefficient formula",
      ruleVersion: TAX_RULE_VERSION,
    };
  }
  return calculatePayg(
    buildPaygInput({
      profile: input.profile,
      payer: input.payer,
      rulePeriod,
      period,
      earnings: availableNumber(taxablePay),
    }),
  );
}

function calculateRepresentativePayroll(input: PayrollInput): PayrollResult {
  const period = periodFrom(input.payer);
  const grossBaseCash = grossPay(input, period);
  const salarySacrifice = deduction(input.payer, "periodSacrifice", "Period salary sacrifice");
  const personalSuper = deduction(
    input.payer,
    "periodPersonalSuper",
    "Period personal-super deduction",
  );
  const otherDeductions = deduction(
    input.payer,
    "periodOtherDeductions",
    "Period other post-tax deductions",
  );
  const taxablePay = remainingCash(grossBaseCash, [salarySacrifice], "Salary sacrifice");
  let rules: readonly PaygRulePeriod[] = ["2026-july"];
  if (input.year === "2025-26") {
    rules = ["2025-july", "2025-september"];
  }
  const rulePeriods = rules.map((rulePeriod): PayrollRuleResult => {
    const result = withholding(input, period, rulePeriod, taxablePay);
    const cashAfterWithholding = remainingCash(taxablePay, [result.combined], "Withholding");
    return {
      rulePeriod,
      withholding: result,
      cashAfterWithholding,
      bankEstimate: remainingCash(
        cashAfterWithholding,
        [personalSuper, otherDeductions],
        "Post-tax deduction",
      ),
    };
  });
  return {
    period,
    grossBaseCash,
    salarySacrifice,
    taxablePay,
    personalSuper,
    otherDeductions,
    conversionNote,
    sourceNotes,
    rulePeriods,
  };
}

export { calculateRepresentativePayroll, payrollPeriodConversions };
