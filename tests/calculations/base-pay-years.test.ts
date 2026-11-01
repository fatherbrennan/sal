import { expect, it } from "bun:test";
import {
  type ComparisonInput,
  calculateComparison,
} from "../../src/lib/calculations/comparison.ts";
import { metricAmount } from "../../src/lib/calculations/comparison-insights.ts";
import type { TaxYear } from "../../src/lib/calculations/tax/types.d.ts";
import { bonus, offer, profile } from "./package-fixture.ts";
import { amount, checkedDecimalPlaces } from "./tax/fixtures.ts";

function input(year: TaxYear): ComparisonInput {
  const record = offer({
    amount: "105000",
    unit: "annual",
    inclusion: "includes",
    employment: "full-time",
    superEligible: "yes",
    superRate: "12",
    superLimit: "statutory",
    evenSuper: "yes",
    weeklyHours: "40",
    weeks: "52",
  });
  record.items = {
    earnings: [bonus({ amount: "10000", inclusion: "includes", eligible: "yes", included: "no" })],
  };
  return {
    offer: record,
    profile: { ...profile, household: "single", standardDeduction: "no" },
    vehicle: {},
    year,
    target: false,
    oneOff: false,
    timeValue: false,
  };
}

// T01 Schedule 7 and T08 s6: independent band arithmetic; taxable cents use sal's estimate.
const years = [
  {
    year: "2025-26" as const,
    baseIncomeTax: 18_913,
    baseTax: 20_788,
    combinedTax: 23_644.96,
    baseNet: 72_962,
    combinedNet: 79_033.611_428_571_43,
    crossingBaseTax: 19_588,
    crossingCombinedTax: 39_838,
    crossingBaseNet: 70_412,
    crossingCombinedNet: 110_162,
  },
  {
    year: "2026-27" as const,
    baseIncomeTax: 18_645,
    baseTax: 20_520,
    combinedTax: 23_376.96,
    baseNet: 73_230,
    combinedNet: 79_301.611_428_571_43,
    crossingBaseTax: 19_320,
    crossingCombinedTax: 39_570,
    crossingBaseNet: 70_680,
    crossingCombinedNet: 110_430,
  },
];

const expected = {
  baseCash: 93_750,
  baseSuper: 11_250,
  bonusCash: 8928.571_428_571_428,
  bonusSuper: 1071.428_571_428_571,
  baseCashHourly: 45.072_115_384_615_39,
  combinedCashHourly: 49.364_697_802_197_8,
  combinedPackageHourly: 55.288_461_538_461_54,
  basePackageHourly: 50.480_769_230_769_23,
  combinedCash: 102_678.571_428_571_43,
  combinedTaxable: 102_678,
  baseMedicare: 1875,
};

it.each(years)(
  "base-only year integration preserves inclusive pay and tax precision: $year",
  (row) => {
    const source = input(row.year);
    const original = structuredClone(source);
    const combined = calculateComparison(source);
    const base = calculateComparison({ ...source, baseOnly: true });
    const values = [
      ["Annual base cash before deductions", expected.baseCash, expected.baseCash],
      ["Base employer super", expected.baseSuper, expected.baseSuper],
      ["Selected bonus / commission cash", expected.bonusCash, 0],
      ["Selected bonus / commission super", expected.bonusSuper, 0],
      ["Base cash per paid hour", expected.baseCashHourly, expected.baseCashHourly],
      ["Cash before tax per paid hour", expected.combinedCashHourly, expected.baseCashHourly],
      [
        "Package value before tax per paid hour",
        expected.combinedPackageHourly,
        expected.basePackageHourly,
      ],
      ["Cash after tax and personal super", row.combinedNet, row.baseNet],
    ] as const;
    for (const [label, combinedExpected, baseExpected] of values) {
      expect(metricAmount(combined, label)).toBeCloseTo(combinedExpected, checkedDecimalPlaces);
      expect(metricAmount(base, label)).toBeCloseTo(baseExpected, checkedDecimalPlaces);
    }
    const baseTax = base.tax.withOffer;
    expect(amount(baseTax.standardDeduction)).toBe(0);
    expect(amount(combined.tax.withOffer.standardDeduction)).toBe(0);
    expect(amount(baseTax.taxableInput)).toBe(expected.baseCash);
    expect(amount(combined.tax.withOffer.derivedTaxableIncome)).toBeCloseTo(
      expected.combinedCash,
      checkedDecimalPlaces,
    );
    expect(amount(combined.tax.withOffer.taxableInput)).toBe(expected.combinedTaxable);
    expect(amount(baseTax.annual.basicIncomeTax)).toBe(row.baseIncomeTax);
    expect(amount(baseTax.annual.medicare)).toBe(expected.baseMedicare);
    expect(amount(base.tax.withoutOffer.annual.rawComponentSubtotal)).toBe(0);
    expect(amount(base.tax.incrementalTax)).toBeCloseTo(row.baseTax, checkedDecimalPlaces);
    expect(amount(combined.tax.incrementalTax)).toBeCloseTo(row.combinedTax, checkedDecimalPlaces);
    expect(baseTax.annual.finalAssessment.status).toBe("unavailable");
    expect(source).toEqual(original);
  },
);

it.each(years)("base-only year integration recomputes tax across the 135000 band: $year", (row) => {
  const source = input(row.year);
  source.offer.fields = { ...source.offer.fields, amount: "90000", inclusion: "excludes" };
  source.offer.items = {
    earnings: [bonus({ amount: "60000", inclusion: "excludes", eligible: "yes", included: "no" })],
  };
  const combined = calculateComparison(source);
  const base = calculateComparison({ ...source, baseOnly: true });
  expect(amount(base.tax.incrementalTax)).toBe(row.crossingBaseTax);
  expect(amount(combined.tax.incrementalTax)).toBe(row.crossingCombinedTax);
  expect(metricAmount(base, "Cash after tax and personal super")).toBe(row.crossingBaseNet);
  expect(metricAmount(combined, "Cash after tax and personal super")).toBe(row.crossingCombinedNet);
});
