import { expect, it } from "bun:test";
import type { HelpInput, TaxYear } from "../../../src/lib/calculations/tax/types.d.ts";
import { calculateAnnualTax } from "../../../src/lib/calculations/tax.ts";
import { amount, annualInput, checkedDecimalPlaces } from "./fixtures.ts";

const expectedAmounts = {
  debtCap: 100.25,
};

function help(overrides: Partial<Extract<HelpInput, { scheme: "help" }>> = {}): HelpInput {
  return {
    scheme: "help",
    repaymentIncome: 100_000,
    establishedRepayableDebt: 100_000,
    section8FamilyExemption: false,
    ordinaryLiabilityEligible: true,
    ...overrides,
  };
}

// T12/T13 exact statutory expression; T50 Grace is the independent 80,000 -> 1,950 fixture.
it.each([
  { year: "2025-26", income: 67_000, expected: 0 },
  { year: "2025-26", income: 67_001, expected: 0.15 },
  { year: "2025-26", income: 80_000, expected: 1950 },
  { year: "2025-26", income: 125_000, expected: 8700 },
  { year: "2025-26", income: 125_001, expected: 8700.17 },
  { year: "2025-26", income: 200_000, expected: 20_000 },
  { year: "2026-27", income: 69_528, expected: 0 },
  { year: "2026-27", income: 69_529, expected: 0.15 },
  { year: "2026-27", income: 129_717, expected: 9028.35 },
  { year: "2026-27", income: 129_718, expected: 9028.52 },
  { year: "2026-27", income: 137_064, expected: 10_277.34 },
  { year: "2026-27", income: 186_050, expected: 18_604.96 },
  { year: "2026-27", income: 186_051, expected: 18_605.1 },
  { year: "2026-27", income: 200_000, expected: 20_000 },
] satisfies { year: TaxYear; income: number; expected: number }[])(
  "retains the statutory raw HELP base and cap: $year/$income",
  ({ year, income, expected }) => {
    expect(
      amount(
        calculateAnnualTax(annualInput({ year, help: help({ repaymentIncome: income }) })).help,
      ),
    ).toBeCloseTo(expected, checkedDecimalPlaces);
  },
);

it("caps HELP by established repayable debt, with zero distinct from unknown", () => {
  expect(
    amount(
      calculateAnnualTax(annualInput({ help: help({ establishedRepayableDebt: 100.25 }) })).help,
    ),
  ).toBeCloseTo(expectedAmounts.debtCap, checkedDecimalPlaces);
  expect(
    amount(calculateAnnualTax(annualInput({ help: help({ establishedRepayableDebt: 0 }) })).help),
  ).toBeCloseTo(0, checkedDecimalPlaces);
  expect(
    amount(
      calculateAnnualTax(
        annualInput({
          help: help({ section8FamilyExemption: true, establishedRepayableDebt: null }),
        }),
      ).help,
    ),
  ).toBeCloseTo(0, checkedDecimalPlaces);
});

it.each([
  { input: null },
  { input: { scheme: "other-or-multiple" } },
  { input: help({ ordinaryLiabilityEligible: null }) },
  { input: help({ ordinaryLiabilityEligible: false }) },
  { input: help({ section8FamilyExemption: null }) },
  { input: help({ repaymentIncome: null }) },
  { input: help({ establishedRepayableDebt: null }) },
] satisfies { input: HelpInput | null }[])(
  "does not assume eligibility, unlimited debt or universal loan schemes",
  ({ input }) => {
    expect(calculateAnnualTax(annualInput({ help: input })).help.status).toBe("unavailable");
  },
);
