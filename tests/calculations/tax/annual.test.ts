import { expect, it } from "bun:test";
import { calculateStandardDeduction } from "../../../src/lib/calculations/tax/deduction.ts";
import { TAX_RULE_VERSION, TAX_SOURCES } from "../../../src/lib/calculations/tax/sources.ts";
import { calculateAnnualTax } from "../../../src/lib/calculations/tax.ts";
import { amount, annualInput, checkedDecimalPlaces } from "./fixtures.ts";

const expectedAmounts = {
  ordinarySubtotal: 22_788,
};

// T01/AT03: independently recorded statutory boundaries, not final assessment fixtures.
it.each([
  { income: 0, old: 0, current: 0 },
  { income: 18_200, old: 0, current: 0 },
  { income: 18_201, old: 0.16, current: 0.15 },
  { income: 45_000, old: 4288, current: 4020 },
  { income: 45_001, old: 4288.3, current: 4020.3 },
  { income: 135_000, old: 31_288, current: 31_020 },
  { income: 135_001, old: 31_288.37, current: 31_020.37 },
  { income: 190_000, old: 51_638, current: 51_370 },
  { income: 190_001, old: 51_638.45, current: 51_370.45 },
])("uses each year's established whole-dollar tax bands: $income", ({ income, old, current }) => {
  expect(
    amount(calculateAnnualTax(annualInput({ taxableIncome: income })).basicIncomeTax),
  ).toBeCloseTo(old, checkedDecimalPlaces);
  expect(
    amount(
      calculateAnnualTax(annualInput({ year: "2026-27", taxableIncome: income })).basicIncomeTax,
    ),
  ).toBeCloseTo(current, checkedDecimalPlaces);
});

it.each([
  { income: 18_200, offset: 0, after: 0 },
  { income: 22_575, offset: 700, after: 0 },
  { income: 22_576, offset: 700, after: 0.16 },
  { income: 37_501, offset: 699.95, after: 2388.21 },
  { income: 45_000, offset: 325, after: 3963 },
  { income: 45_001, offset: 324.985, after: 3963.315 },
  { income: 45_003, offset: 324.955, after: 3963.945 },
  { income: 66_665, offset: 0.025, after: 10_787.475 },
  { income: 66_666, offset: 0.01, after: 10_787.79 },
  { income: 66_668, offset: 0, after: 10_788.4 },
])(
  "preserves exact raw LITO and its non-refundable limit: $income",
  ({ income, offset, after }) => {
    const result = calculateAnnualTax(annualInput({ taxableIncome: income }));
    expect(amount(result.lito)).toBeCloseTo(offset, checkedDecimalPlaces);
    expect(amount(result.incomeTaxAfterLito)).toBeCloseTo(after, checkedDecimalPlaces);
  },
);

it("does not invent the statutory negative-half-cent LITO endpoint", () => {
  const result = calculateAnnualTax(annualInput({ taxableIncome: 66_667 }));
  expect(result.basicIncomeTax.status).toBe("available");
  expect(result.lito).toMatchObject({ status: "unavailable", code: "unverified-rule" });
  expect(result.rawComponentSubtotal).toEqual(result.lito);
});

it("labels the complete ordinary subtotal as raw and leaves final assessment unavailable", () => {
  const result = calculateAnnualTax(annualInput());
  expect(amount(result.rawComponentSubtotal)).toBeCloseTo(
    expectedAmounts.ordinarySubtotal,
    checkedDecimalPlaces,
  );
  expect(result.rawComponentSubtotal).toMatchObject({ basis: "raw annual component" });
  expect(result.finalAssessment).toMatchObject({ status: "unavailable", code: "unverified-rule" });
  expect(result.ruleVersion).toBe(TAX_RULE_VERSION);
  expect(TAX_SOURCES.get("T01")).toContain("C2004A03348");
});

it.each([
  { value: null },
  { value: -1 },
  { value: Number.NaN },
  { value: Number.POSITIVE_INFINITY },
  { value: 1_000_000_001 },
  { value: 45_000.25 },
])("rejects missing/invalid established taxable income: $value", ({ value }) => {
  const result = calculateAnnualTax(annualInput({ taxableIncome: value }));
  expect(result.basicIncomeTax.status).toBe("unavailable");
  expect(result.rawComponentSubtotal.status).toBe("unavailable");
  expect(amount(result.help)).toBeCloseTo(0, checkedDecimalPlaces);
});

it.each([
  { value: null, code: "missing-input" },
  { value: false, code: "unsupported-regime" },
])("distinguishes unknown and unsupported eligibility: $code", ({ value, code }) => {
  const result = calculateAnnualTax(annualInput({ ordinaryResidentAdult: value }));
  expect(result.basicIncomeTax).toMatchObject({ status: "unavailable", code });
  expect(result.help).toEqual(result.basicIncomeTax);
  const partial = calculateAnnualTax(annualInput({ otherAssessmentItemsAbsent: value }));
  expect(partial.rawComponentSubtotal).toMatchObject({ status: "unavailable", code });
  expect(partial.basicIncomeTax.status).toBe("available");
});

it.each([
  { labour: 100_000, expenses: 0, expected: 1000 },
  { labour: 100_000, expenses: 600, expected: 400 },
  { labour: 100_000, expenses: 1200, expected: 0 },
  { labour: 400, expenses: 50, expected: 350 },
  { labour: 0, expenses: 0, expected: 0 },
])(
  "calculates only the separately established 2026–27 standard deduction: $expected",
  ({ labour, expenses, expected }) => {
    expect(
      amount(
        calculateStandardDeduction({
          year: "2026-27",
          eligible: true,
          assessableLabourIncome: labour,
          specifiedDeductions: expenses,
        }),
      ),
    ).toBeCloseTo(expected, checkedDecimalPlaces);
  },
);

it("does not apply the future standard deduction to 2025–26 or ineligible income", () => {
  expect(
    amount(
      calculateStandardDeduction({
        year: "2025-26",
        eligible: null,
        assessableLabourIncome: null,
        specifiedDeductions: null,
      }),
    ),
  ).toBeCloseTo(0, checkedDecimalPlaces);
  expect(
    amount(
      calculateStandardDeduction({
        year: "2026-27",
        eligible: false,
        assessableLabourIncome: null,
        specifiedDeductions: null,
      }),
    ),
  ).toBeCloseTo(0, checkedDecimalPlaces);
});

it.each([
  { eligible: null, assessableLabourIncome: null, specifiedDeductions: null },
  { eligible: true, assessableLabourIncome: null, specifiedDeductions: 0 },
  { eligible: true, assessableLabourIncome: 1000, specifiedDeductions: null },
  { eligible: true, assessableLabourIncome: 1000, specifiedDeductions: -0.001 },
])("does not substitute missing or invalid deduction facts", (input) => {
  expect(calculateStandardDeduction({ year: "2026-27", ...input }).status).toBe("unavailable");
});
