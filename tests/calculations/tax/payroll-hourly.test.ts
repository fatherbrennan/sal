import { expect, it } from "bun:test";
import { calculatePayrollHourly } from "../../../src/lib/calculations/tax/payroll-hourly.ts";
import type {
  PayrollHourlyInput,
  PayrollResult,
} from "../../../src/lib/calculations/tax/payroll-types.d.ts";
import type { PayPeriod, TaxAmount } from "../../../src/lib/calculations/tax/types.d.ts";
import { amount, checkedDecimalPlaces } from "./fixtures.ts";

const specimen = {
  gross: 2000,
  sacrifice: 100,
  taxable: 1900,
  personalSuper: 40,
  other: 20,
  ordinary: 300,
  combined: 400,
  loan: 100,
  afterWithholding: 1500,
  bank: 1440,
};

function cash(value: number): TaxAmount {
  return {
    status: "available",
    amount: value,
    basis: "representative payroll estimate",
    sources: ["synthetic payroll fixture"],
  };
}

function payroll(period: PayPeriod | null = "fortnightly"): PayrollResult {
  return {
    period,
    grossBaseCash: cash(specimen.gross),
    salarySacrifice: cash(specimen.sacrifice),
    taxablePay: cash(specimen.taxable),
    personalSuper: cash(specimen.personalSuper),
    otherDeductions: cash(specimen.other),
    conversionNote: "Synthetic per-period amounts; no annual deposit schedule.",
    sourceNotes: ["Synthetic amounts test conversion, not tax rules."],
    rulePeriods: [
      {
        rulePeriod: "2026-july",
        withholding: {
          ordinary: cash(specimen.ordinary),
          combined: cash(specimen.combined),
          loanIncrement: cash(specimen.loan),
          method: "published combined coefficient formula",
          ruleVersion: "synthetic",
        },
        cashAfterWithholding: cash(specimen.afterWithholding),
        bankEstimate: cash(specimen.bank),
      },
    ],
  };
}

it("shows separate gross, transferred-super, withholding and bank hourly values", () => {
  const result = calculatePayrollHourly({ payroll: payroll(), weeklyHours: 40, weeks: 52 });
  const expected = {
    hours: 80,
    gross: 25,
    sacrifice: 1.25,
    taxable: 23.75,
    super: 0.5,
    other: 0.25,
  };
  expect(result.allocatedPeriodHours).toBe(expected.hours);
  expect(amount(result.grossBaseCash)).toBe(expected.gross);
  expect(amount(result.salarySacrifice)).toBe(expected.sacrifice);
  expect(amount(result.taxablePay)).toBe(expected.taxable);
  expect(amount(result.personalSuper)).toBe(expected.super);
  expect(amount(result.otherDeductions)).toBe(expected.other);
  expect(result.rulePeriods).toMatchObject([
    {
      rulePeriod: "2026-july",
      withholding: {
        ordinary: { amount: 3.75 },
        combined: { amount: 5 },
        loanIncrement: { amount: 1.25 },
      },
      cashAfterWithholding: { amount: 18.75 },
      bankEstimate: { amount: 18, basis: "representative payroll hourly estimate" },
    },
  ]);
  expect(result.denominatorNote).toContain("not actual work in the period");
  expect(result.denominatorNote).toContain("forecast of annual bank deposits");
});

it.each([
  { period: "weekly", hours: 40, rate: 50 },
  { period: "fortnightly", hours: 80, rate: 25 },
  { period: "monthly", hours: 173.333_333_333_333, rate: 11.538_461_538_462 },
  { period: "quarterly", hours: 520, rate: 3.846_153_846_154 },
] satisfies { period: PayPeriod; hours: number; rate: number }[])(
  "allocates the standard paid-hour denominator for $period",
  ({ period, hours, rate }) => {
    const result = calculatePayrollHourly({ payroll: payroll(period), weeklyHours: 40, weeks: 52 });
    expect(result.allocatedPeriodHours).toBeCloseTo(hours, checkedDecimalPlaces);
    expect(amount(result.grossBaseCash)).toBeCloseTo(rate, checkedDecimalPlaces);
  },
);

it("uses edited conversion weeks without rounding intermediate hourly values to cents", () => {
  const result = calculatePayrollHourly({ payroll: payroll(), weeklyHours: 40, weeks: 48 });
  const expected = { hours: 73.846_153_846_154, rate: 27.083_333_333_333 };
  expect(result.allocatedPeriodHours).toBeCloseTo(expected.hours, checkedDecimalPlaces);
  expect(amount(result.grossBaseCash)).toBeCloseTo(expected.rate, checkedDecimalPlaces);
});

it.each([
  { weeklyHours: null },
  { weeks: null },
  { payroll: payroll(null) },
  { weeklyHours: 0 },
  { weeks: 0 },
  { weeklyHours: -1, weeks: -1 },
  { weeklyHours: Number.NaN },
  { weeks: Number.POSITIVE_INFINITY },
  { weeklyHours: Number.MAX_VALUE, weeks: Number.MAX_VALUE },
  { weeklyHours: Number.MIN_VALUE, weeks: Number.MIN_VALUE },
] satisfies Partial<PayrollHourlyInput>[])(
  "leaves an unknown or invalid denominator unavailable",
  (input) => {
    const result = calculatePayrollHourly({
      payroll: payroll(),
      weeklyHours: 40,
      weeks: 52,
      ...input,
    });
    expect(result.allocatedPeriodHours).toBeNull();
    expect(result.grossBaseCash.status).toBe("unavailable");
    expect(result.rulePeriods[0]?.bankEstimate.status).toBe("unavailable");
  },
);

it("preserves the original unavailable tax reason and independent available cash", () => {
  const original = payroll();
  const unknown: TaxAmount = {
    status: "unavailable",
    code: "unverified-rule",
    reason: "This combined study-loan branch is not verified.",
    sources: ["T33"],
  };
  for (const rule of original.rulePeriods) {
    rule.withholding.combined = unknown;
    rule.bankEstimate = unknown;
  }
  const result = calculatePayrollHourly({ payroll: original, weeklyHours: 40, weeks: 52 });
  const expectedGross = 25;
  expect(amount(result.grossBaseCash)).toBe(expectedGross);
  expect(result.rulePeriods[0]?.withholding.combined).toEqual(unknown);
  expect(result.rulePeriods[0]?.bankEstimate).toEqual(unknown);
  expect(
    calculatePayrollHourly({ payroll: original, weeklyHours: null, weeks: 52 }).rulePeriods[0]
      ?.bankEstimate,
  ).toEqual(unknown);
});

it("keeps explicit zero available and prevents numeric overflow from becoming an hourly value", () => {
  const original = payroll();
  original.personalSuper = cash(0);
  const result = calculatePayrollHourly({ payroll: original, weeklyHours: 1e-307, weeks: 1 });
  expect(amount(result.personalSuper)).toBe(0);
  expect(result.grossBaseCash).toMatchObject({ status: "unavailable", code: "invalid-input" });
});
