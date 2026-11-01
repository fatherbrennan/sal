import { expect, it } from "bun:test";
import type { TaxYear } from "../../../src/lib/calculations/tax/types.d.ts";
import { calculateAnnualTax } from "../../../src/lib/calculations/tax.ts";
import { amount, annualInput, checkedDecimalPlaces, medicare, mls } from "./fixtures.ts";

const expectedAmounts = {
  currentLossAddBack: 1000,
  tomSurcharge: 1170,
  oldSuperAddBack: 1250,
  singleParentAboveThreshold: 2035.01,
};

const years: TaxYear[] = ["2025-26", "2026-27"];

// T45 Angie, T71 Matthew and M-B1; eligibility is a fixture premise.
it.each([
  { income: 28_011, expected: 0 },
  { income: 28_012, expected: 0.1 },
  { income: 29_000, expected: 98.9 },
  { income: 35_013, expected: 700.2 },
  { income: 35_014, expected: 700.28 },
  { income: 75_000, expected: 1500 },
])(
  "matches ordinary Medicare phase-in and published component cases: $income",
  ({ income, expected }) => {
    for (const year of years) {
      expect(
        amount(calculateAnnualTax(annualInput({ year, taxableIncome: income })).medicare),
      ).toBeCloseTo(expected, checkedDecimalPlaces);
    }
  },
);

// MC-B1–B4 and M-B2: exact statutory-derived couple allocation, before final rounding.
it.each([
  { own: 0, spouse: 0, children: 0, expected: 0 },
  { own: 29_000, spouse: 0, children: 0, expected: 0 },
  { own: 40_000, spouse: 10_000, children: 0, expected: 76.2 },
  { own: 10_000, spouse: 40_000, children: 0, expected: 0 },
  { own: 30_000, spouse: 28_012, children: 0, expected: 116.16 },
  { own: 30_000, spouse: 28_500, children: 0, expected: 176.438_461_538_461_52 },
  { own: 47_238, spouse: 0, children: 0, expected: 0 },
  { own: 47_239, spouse: 0, children: 0, expected: 0.1 },
  { own: 59_047, spouse: 0, children: 0, expected: 1180.9 },
  { own: 59_048, spouse: 0, children: 0, expected: 1180.96 },
  { own: 69_892, spouse: 0, children: 2, expected: 1397.8 },
  { own: 69_893, spouse: 0, children: 2, expected: 1397.86 },
])(
  "preserves family allocation, phase-in and child threshold: $own/$spouse",
  ({ own, spouse, children, expected }) => {
    for (const year of years) {
      const result = calculateAnnualTax(
        annualInput({
          year,
          taxableIncome: own,
          medicare: medicare({
            family: "full-year-spouse",
            spouseTaxableIncome: spouse,
            establishedQualifyingChildren: children,
          }),
        }),
      );
      expect(amount(result.medicare)).toBeCloseTo(expected, checkedDecimalPlaces);
    }
  },
);

it.each([
  { input: null },
  { input: medicare({ family: null }) },
  { input: medicare({ ordinaryLevyEligible: null }) },
  { input: medicare({ ordinaryLevyEligible: false }) },
  { input: medicare({ family: "unsupported" }) },
  { input: medicare({ family: "full-year-spouse", spouseTaxableIncome: null }) },
  { input: medicare({ family: "full-year-spouse", spouseTaxableIncome: 0 }) },
])("leaves unresolved Medicare branches unavailable", ({ input }) => {
  const result = calculateAnnualTax(annualInput({ medicare: input }));
  expect(result.medicare.status).toBe("unavailable");
  expect(result.rawComponentSubtotal.status).toBe("unavailable");
});

it.each([
  { year: "2025-26", income: 101_000, expected: 0 },
  { year: "2025-26", income: 101_001, expected: 1010.01 },
  { year: "2025-26", income: 118_000, expected: 1180 },
  { year: "2025-26", income: 118_001, expected: 1475.0125 },
  { year: "2025-26", income: 158_000, expected: 1975 },
  { year: "2025-26", income: 158_001, expected: 2370.015 },
  { year: "2026-27", income: 105_000, expected: 0 },
  { year: "2026-27", income: 105_001, expected: 1050.01 },
  { year: "2026-27", income: 123_000, expected: 1230 },
  { year: "2026-27", income: 123_001, expected: 1537.5125 },
  { year: "2026-27", income: 164_000, expected: 2050 },
  { year: "2026-27", income: 164_001, expected: 2460.015 },
] satisfies { year: TaxYear; income: number; expected: number }[])(
  "tests MLS inclusive tier boundaries: $year/$income",
  ({ year, income, expected }) => {
    expect(
      amount(calculateAnnualTax(annualInput({ year, taxableIncome: income })).mls),
    ).toBeCloseTo(expected, checkedDecimalPlaces);
  },
);

it("matches T46 Tom without treating reportable super or spouse income as chargeable cash", () => {
  expect(
    amount(
      calculateAnnualTax(
        annualInput({
          year: "2026-27",
          taxableIncome: 90_000,
          mls: mls({ reportableFringeBenefits: 27_000 }),
        }),
      ).mls,
    ),
  ).toBeCloseTo(expectedAmounts.tomSurcharge, checkedDecimalPlaces);
  expect(
    amount(
      calculateAnnualTax(
        annualInput({ taxableIncome: 100_000, mls: mls({ reportableSuper: 20_000 }) }),
      ).mls,
    ),
  ).toBeCloseTo(expectedAmounts.oldSuperAddBack, checkedDecimalPlaces);
  expect(
    amount(
      calculateAnnualTax(
        annualInput({
          year: "2026-27",
          taxableIncome: 100_000,
          mls: mls({ netInvestmentLoss: 20_000 }),
        }),
      ).mls,
    ),
  ).toBeCloseTo(expectedAmounts.currentLossAddBack, checkedDecimalPlaces);
});

it.each([
  { days: 0, expected: 0 },
  { days: 100, expected: 300 },
  { days: 365, expected: 1095 },
])("uses full-year tier income and established liable days: $days", ({ days, expected }) => {
  const result = calculateAnnualTax(
    annualInput({
      taxableIncome: 109_500,
      mls: mls({
        household: "full-year-spouse",
        spouseSurchargeIncome: 100_000,
        reportableSuper: 20_000,
        establishedQualifyingChildren: 0,
        liableDays: days,
      }),
    }),
  );
  expect(amount(result.mls)).toBeCloseTo(expected, checkedDecimalPlaces);
});

it.each([
  { own: 28_011, expected: 0 },
  { own: 28_012, expected: 280.12 },
])("applies the spouse's own-income condition separately: $own", ({ own, expected }) => {
  expect(
    amount(
      calculateAnnualTax(
        annualInput({
          taxableIncome: own,
          mls: mls({
            household: "full-year-spouse",
            spouseSurchargeIncome: 200_000,
            establishedQualifyingChildren: 0,
          }),
        }),
      ).mls,
    ),
  ).toBeCloseTo(expected, checkedDecimalPlaces);
});

it("uses the family threshold and child uplift for a single parent", () => {
  expect(
    amount(
      calculateAnnualTax(
        annualInput({
          taxableIncome: 203_500,
          mls: mls({ household: "single-with-dependants", establishedQualifyingChildren: 2 }),
        }),
      ).mls,
    ),
  ).toBeCloseTo(0, checkedDecimalPlaces);
  expect(
    amount(
      calculateAnnualTax(
        annualInput({
          taxableIncome: 203_501,
          mls: mls({ household: "single-with-dependants", establishedQualifyingChildren: 2 }),
        }),
      ).mls,
    ),
  ).toBeCloseTo(expectedAmounts.singleParentAboveThreshold, checkedDecimalPlaces);
});

it.each([
  { input: null },
  { input: mls({ household: null }) },
  { input: mls({ ordinarySurchargeEligible: false }) },
  { input: mls({ household: "unsupported" }) },
  { input: mls({ reportableFringeBenefits: null }) },
  { input: mls({ reportableSuper: null }) },
  { input: mls({ netInvestmentLoss: null }) },
  { input: mls({ liableDays: null }) },
  { input: mls({ liableDays: 366 }) },
  { input: mls({ liableDays: -1 }) },
  { input: mls({ household: "single-with-dependants", establishedQualifyingChildren: null }) },
  { input: mls({ household: "full-year-spouse", establishedQualifyingChildren: 0 }) },
])("does not fabricate missing surcharge facts", ({ input }) => {
  expect(calculateAnnualTax(annualInput({ mls: input })).mls.status).toBe("unavailable");
});
