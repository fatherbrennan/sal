import { unavailable } from "./common.ts";
import { payrollPeriodConversions } from "./payroll.ts";
import type { PayrollHourlyInput, PayrollHourlyResult } from "./payroll-types.d.ts";
import type { TaxAmount } from "./types.d.ts";

const denominatorNote =
  "Per allocated standard paid hour: weekly hours × editable conversion weeks, divided by 52, 26, 12 or 4 for weekly, fortnightly, monthly or quarterly pay. This is not actual work in the period or a forecast of annual bank deposits.";

function allocateHours(input: PayrollHourlyInput): { hours: number | null; missing: boolean } {
  const { weeklyHours, weeks, payroll } = input;
  if (weeklyHours === null || weeks === null || payroll.period === null) {
    return { hours: null, missing: true };
  }
  const hours = (weeklyHours * weeks) / payrollPeriodConversions[payroll.period];
  if (weeklyHours <= 0 || weeks <= 0 || !Number.isFinite(hours) || hours <= 0) {
    return { hours: null, missing: false };
  }
  return { hours, missing: false };
}

function hourlyAmount(
  value: TaxAmount,
  allocation: { hours: number | null; missing: boolean },
): TaxAmount {
  if (value.status === "unavailable") {
    return value;
  }
  if (allocation.hours === null) {
    let code: "missing-input" | "invalid-input" = "invalid-input";
    if (allocation.missing) {
      code = "missing-input";
    }
    return unavailable(
      code,
      "A supported pay frequency and positive finite weekly hours and conversion weeks are required for payroll hourly values.",
      value.sources,
    );
  }
  const amount = value.amount / allocation.hours;
  if (!Number.isFinite(amount)) {
    return unavailable(
      "invalid-input",
      "Payroll hourly value exceeds the numeric range.",
      value.sources,
    );
  }
  return { ...value, amount, basis: "representative payroll hourly estimate" };
}

function calculatePayrollHourly(input: PayrollHourlyInput): PayrollHourlyResult {
  const allocation = allocateHours(input);
  const { payroll } = input;
  return {
    period: payroll.period,
    allocatedPeriodHours: allocation.hours,
    denominatorNote,
    sourceNotes: payroll.sourceNotes,
    grossBaseCash: hourlyAmount(payroll.grossBaseCash, allocation),
    salarySacrifice: hourlyAmount(payroll.salarySacrifice, allocation),
    taxablePay: hourlyAmount(payroll.taxablePay, allocation),
    personalSuper: hourlyAmount(payroll.personalSuper, allocation),
    otherDeductions: hourlyAmount(payroll.otherDeductions, allocation),
    rulePeriods: payroll.rulePeriods.map((rule) => ({
      rulePeriod: rule.rulePeriod,
      withholding: {
        ...rule.withholding,
        ordinary: hourlyAmount(rule.withholding.ordinary, allocation),
        combined: hourlyAmount(rule.withholding.combined, allocation),
        loanIncrement: hourlyAmount(rule.withholding.loanIncrement, allocation),
      },
      cashAfterWithholding: hourlyAmount(rule.cashAfterWithholding, allocation),
      bankEstimate: hourlyAmount(rule.bankEstimate, allocation),
    })),
  };
}

export { calculatePayrollHourly };
