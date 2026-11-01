import { expect, it } from "bun:test";
import { calculateRepresentativePayroll } from "../../../src/lib/calculations/tax/payroll.ts";
import type {
  PayrollInput,
  PayrollRuleResult,
} from "../../../src/lib/calculations/tax/payroll-types.d.ts";
import type { TaxFields, TaxYear } from "../../../src/lib/calculations/tax/types.d.ts";
import { amount } from "./fixtures.ts";
import { profile } from "./profile-fixtures.ts";

const specimen = { oldWithholding: 286, currentWithholding: 276, oldBank: 1664, currentBank: 1674 };

function input(payer: TaxFields = {}, overrides: Partial<PayrollInput> = {}): PayrollInput {
  return {
    year: "2026-27",
    annualBaseCash: 57_200,
    profile: profile(),
    payer: {
      employment: "full-time",
      regularPay: "yes",
      payFrequency: "fortnightly",
      ordinaryPayroll: "yes",
      tfnProvided: "yes",
      threshold: "yes",
      noPaygAdjustments: "yes",
      periodSacrifice: "200",
      periodPersonalSuper: "40",
      periodOtherDeductions: "10",
      ...payer,
    },
    ...overrides,
  };
}

function firstRule(value: PayrollInput): PayrollRuleResult {
  const [result] = calculateRepresentativePayroll(value).rulePeriods;
  if (result === undefined) {
    throw new Error("Expected a representative rule period.");
  }
  return result;
}

// S05-A supplies independent $2,000 fortnightly PAYG; the $40/$10 outflows are explicit additions.
it.each([
  {
    year: "2025-26",
    expectedWithholding: [specimen.oldWithholding, specimen.oldWithholding],
    expectedBank: [specimen.oldBank, specimen.oldBank],
  },
  {
    year: "2026-27",
    expectedWithholding: [specimen.currentWithholding],
    expectedBank: [specimen.currentBank],
  },
] satisfies { year: TaxYear; expectedWithholding: number[]; expectedBank: number[] }[])(
  "removes valid sacrifice before PAYG and personal transfers after it: $year",
  ({ year, expectedWithholding, expectedBank }) => {
    const result = calculateRepresentativePayroll(input({}, { year }));
    const amounts = { gross: 2200, taxable: 2000 };
    expect(amount(result.grossBaseCash)).toBe(amounts.gross);
    expect(amount(result.taxablePay)).toBe(amounts.taxable);
    expect(result.rulePeriods.map((rule) => amount(rule.withholding.combined))).toEqual(
      expectedWithholding,
    );
    expect(result.rulePeriods.map((rule) => amount(rule.bankEstimate))).toEqual(expectedBank);
    expect(result.conversionNote).toContain("does not predict annual deposit counts");
  },
);

it.each([
  { period: "weekly", annual: 25_948, gross: 499, withheld: 21, bank: 478 },
  { period: "monthly", annual: 27_976, gross: 2331.33, withheld: 117, bank: 2214.33 },
  { period: "quarterly", annual: 52_000, gross: 13_000, withheld: 1794, bank: 11_206 },
])("keeps estimate cents separate from prescribed PAYG rounding: $period", (fixture) => {
  const payrollInput = input(
    {
      payFrequency: fixture.period,
      periodSacrifice: "0",
      periodPersonalSuper: "0",
      periodOtherDeductions: "0",
    },
    { annualBaseCash: fixture.annual },
  );
  const result = calculateRepresentativePayroll(payrollInput);
  const rule = firstRule(payrollInput);
  expect(amount(result.grossBaseCash)).toBe(fixture.gross);
  expect(amount(rule.withholding.combined)).toBe(fixture.withheld);
  expect(amount(rule.bankEstimate)).toBe(fixture.bank);
  expect(rule.bankEstimate).toMatchObject({ basis: "representative payroll estimate" });
});

it("rounds the salary-derived half-cent up without rounding PAYG to cents", () => {
  const result = calculateRepresentativePayroll(
    input({ payFrequency: "weekly", periodSacrifice: "0" }, { annualBaseCash: 52.26 }),
  );
  const expected = 1.01;
  expect(amount(result.grossBaseCash)).toBe(expected);
});

it.each(["periodPersonalSuper", "periodOtherDeductions"])(
  "retains PAYG when %s is unknown",
  (key) => {
    const rule = firstRule(input({ [key]: "" }));
    const expected = { withheld: 276, beforeTransfers: 1724 };
    expect(amount(rule.withholding.combined)).toBe(expected.withheld);
    expect(amount(rule.cashAfterWithholding)).toBe(expected.beforeTransfers);
    expect(rule.bankEstimate).toMatchObject({ status: "unavailable", code: "missing-input" });
  },
);

it.each([
  { periodSacrifice: "" },
  { periodSacrifice: "bad" },
  { periodSacrifice: "-1" },
  { periodSacrifice: "200.001" },
  { periodSacrifice: "2201" },
  { payFrequency: "" },
  { payFrequency: "daily" },
  { regularPay: "" },
  { regularPay: "no" },
  { employment: "sole-trader" },
] satisfies TaxFields[])("does not invent unknown or unsupported base-pay inputs", (payer) => {
  const rule = firstRule(input(payer));
  expect(rule.withholding.combined.status).toBe("unavailable");
  expect(rule.bankEstimate.status).toBe("unavailable");
});

it.each([null, -1, Number.NaN, Number.POSITIVE_INFINITY])(
  "rejects invalid annual cash: %s",
  (annualBaseCash) => {
    const result = calculateRepresentativePayroll(input({}, { annualBaseCash }));
    expect(result.grossBaseCash.status).toBe("unavailable");
  },
);

it.each([{ periodPersonalSuper: "1725" }, { periodOtherDeductions: "bad" }] satisfies TaxFields[])(
  "blocks invalid post-tax outflows without changing PAYG",
  (payer) => {
    const rule = firstRule(input(payer));
    const expected = 276;
    expect(amount(rule.withholding.combined)).toBe(expected);
    expect(rule.bankEstimate).toMatchObject({ status: "unavailable", code: "invalid-input" });
  },
);

it("retains ordinary PAYG when the combined historical loan branch is unverified", () => {
  const result = calculateRepresentativePayroll(
    input({ threshold: "no" }, { year: "2025-26", profile: profile({ studyLoan: "yes" }) }),
  );
  const [early, later] = result.rulePeriods;
  expect(early?.withholding.ordinary.status).toBe("available");
  expect(early?.withholding.combined).toMatchObject({
    status: "unavailable",
    code: "unverified-rule",
  });
  expect(early?.bankEstimate.status).toBe("unavailable");
  expect(later?.bankEstimate.status).toBe("available");
});

it("preserves missing declarations separately from known period cash", () => {
  const payrollInput = input({ tfnProvided: "" });
  const result = calculateRepresentativePayroll(payrollInput);
  const rule = firstRule(payrollInput);
  const expected = 2000;
  expect(amount(result.taxablePay)).toBe(expected);
  expect(rule.withholding.combined).toMatchObject({ status: "unavailable", code: "missing-input" });
  expect(rule.bankEstimate.status).toBe("unavailable");
});
