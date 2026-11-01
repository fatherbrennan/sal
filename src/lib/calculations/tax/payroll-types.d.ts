import type {
  PaygResult,
  PaygRulePeriod,
  PayPeriod,
  TaxAmount,
  TaxFields,
  TaxYear,
} from "./types.d.ts";

interface PayrollInput {
  year: TaxYear;
  annualBaseCash: number | null;
  profile: TaxFields;
  payer: TaxFields;
}

interface PayrollRuleResult {
  rulePeriod: PaygRulePeriod;
  withholding: PaygResult;
  cashAfterWithholding: TaxAmount;
  bankEstimate: TaxAmount;
}

interface PayrollResult {
  period: PayPeriod | null;
  grossBaseCash: TaxAmount;
  salarySacrifice: TaxAmount;
  taxablePay: TaxAmount;
  personalSuper: TaxAmount;
  otherDeductions: TaxAmount;
  conversionNote: string;
  sourceNotes: readonly string[];
  rulePeriods: readonly PayrollRuleResult[];
}

interface PayrollHourlyInput {
  payroll: PayrollResult;
  weeklyHours: number | null;
  weeks: number | null;
}

interface PayrollHourlyResult extends Omit<PayrollResult, "conversionNote"> {
  allocatedPeriodHours: number | null;
  denominatorNote: string;
}

export type {
  PayrollHourlyInput,
  PayrollHourlyResult,
  PayrollInput,
  PayrollResult,
  PayrollRuleResult,
};
