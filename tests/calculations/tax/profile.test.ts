import { expect, it } from "bun:test";
import { calculatePayg } from "../../../src/lib/calculations/tax/payg.ts";
import { buildPaygInput, calculateProfileTax } from "../../../src/lib/calculations/tax/profile.ts";
import type { TaxFields } from "../../../src/lib/calculations/tax/types.d.ts";
import { amount, checkedDecimalPlaces } from "./fixtures.ts";
import { offer, profile } from "./profile-fixtures.ts";

const expected = {
  oldIncrement: 3350,
  withStandard: 1018.9,
  negativeIncrement: -2825,
  sharedStandard: 400,
  offerStandard: 200,
  sharedTi: 49_000,
  offerTi: 59_000,
  repaymentIncome: 128_900,
  help: 9363,
  mls: 1287.5,
  rawFractional: 100_000.75,
  wholeEstimate: 100_000,
  withheld: 276,
};

it("recomputes whole-person scenarios and attributes only their difference to the offer", () => {
  const result = calculateProfileTax({
    year: "2025-26",
    profile: profile({ otherIncome: "50000" }),
    offer: offer({ assessableIncome: 10_000, assessableLabourIncome: 10_000 }),
  });
  expect(amount(result.incrementalTax)).toBeCloseTo(expected.oldIncrement, checkedDecimalPlaces);
  expect(result.withOffer.annual.finalAssessment.status).toBe("unavailable");
  expect(result.withOffer.approximation).toContain("sal estimate");
});

it("recomputes the standard deduction after removing the offer", () => {
  const result = calculateProfileTax({
    year: "2026-27",
    profile: profile({ otherIncome: "20000", standardDeduction: "yes" }),
    offer: offer({ assessableIncome: 10_000, assessableLabourIncome: 10_000 }),
  });
  expect(amount(result.withoutOffer.standardDeduction)).toBe(0);
  expect(amount(result.incrementalTax)).toBeCloseTo(expected.withStandard, checkedDecimalPlaces);
});

it("counts work deductions once and recalculates shared/offer standard-deduction reductions", () => {
  const result = calculateProfileTax({
    year: "2026-27",
    profile: profile({
      otherIncome: "50000",
      otherLabourIncome: "50000",
      deductions: "600",
      otherSpecifiedDeductions: "600",
      standardDeduction: "yes",
    }),
    offer: offer({
      assessableIncome: 10_000,
      assessableLabourIncome: 10_000,
      deductions: 200,
      specifiedWorkDeductions: 200,
    }),
  });
  expect(amount(result.withoutOffer.standardDeduction)).toBe(expected.sharedStandard);
  expect(amount(result.withOffer.standardDeduction)).toBe(expected.offerStandard);
  expect(amount(result.withoutOffer.derivedTaxableIncome)).toBe(expected.sharedTi);
  expect(amount(result.withOffer.derivedTaxableIncome)).toBe(expected.offerTi);
});

it("keeps signed incremental reductions instead of clamping them to zero", () => {
  const result = calculateProfileTax({
    year: "2025-26",
    profile: profile({ otherIncome: "50000" }),
    offer: offer({ assessableIncome: 0, assessableLabourIncome: 0, deductions: 10_000 }),
  });
  expect(amount(result.incrementalTax)).toBeCloseTo(
    expected.negativeIncrement,
    checkedDecimalPlaces,
  );
});

it("adds reportable amounts to their proper tests without adding them as taxable cash", () => {
  const result = calculateProfileTax({
    year: "2025-26",
    profile: profile({
      otherIncome: "20000",
      reportableBenefits: "1000",
      reportableSuper: "5000",
      investmentLoss: "400",
      foreignIncome: "500",
      hospitalCover: "no",
      mlsLiableDays: "365",
      studyLoan: "yes",
      loanScheme: "help",
      loanDebt: "100000",
      helpEligible: "yes",
    }),
    offer: offer({
      assessableIncome: 80_000,
      assessableLabourIncome: 80_000,
      reportableSuper: 20_000,
      reportableBenefits: 2000,
    }),
  });
  expect(result.withOffer.input.help).toMatchObject({ repaymentIncome: expected.repaymentIncome });
  expect(amount(result.withOffer.annual.help)).toBe(expected.help);
  expect(amount(result.withOffer.annual.mls)).toBe(expected.mls);
  expect(result.withOffer.input.taxableIncome).toBe(expected.wholeEstimate);
});

it("preserves fractional raw income and labels the approved estimation convention", () => {
  const result = calculateProfileTax({
    year: "2025-26",
    profile: profile(),
    offer: offer({ assessableIncome: 100_000.75, assessableLabourIncome: 100_000.75 }),
  });
  expect(amount(result.withOffer.derivedTaxableIncome)).toBe(expected.rawFractional);
  expect(amount(result.withOffer.taxableInput)).toBe(expected.wholeEstimate);
  expect(result.withOffer.approximation).toContain("nearest cent");
});

it("normalizes binary division residue before estimating whole-dollar income", () => {
  const quoted = { inclusive: 112_000, superFactor: 1.12 };
  const cash = quoted.inclusive / quoted.superFactor;
  const result = calculateProfileTax({
    year: "2026-27",
    profile: profile({ standardDeduction: "yes" }),
    offer: offer({ assessableIncome: cash, assessableLabourIncome: cash }),
  });
  const expectedTi = 99_000;
  expect(amount(result.withOffer.taxableInput)).toBe(expectedTi);
});

it("uses established overrides once, without subtracting a second standard deduction", () => {
  const result = calculateProfileTax({
    year: "2026-27",
    profile: profile({
      otherIncome: "",
      standardDeduction: "yes",
      otherLabourIncome: "",
      taxableWithOffer: "100000",
      taxableWithoutOffer: "0",
    }),
    offer: offer(),
  });
  expect(result.withOffer.derivedTaxableIncome.status).toBe("unavailable");
  expect(amount(result.withOffer.taxableInput)).toBe(expected.wholeEstimate);
  expect(result.withOffer.approximation).toBeNull();
  expect(result.incrementalTax.status).toBe("available");
});

it("requires both scenario subtotals even if an explicit offer override is valid", () => {
  const result = calculateProfileTax({
    year: "2025-26",
    profile: profile({ otherIncome: "", taxableWithOffer: "100000" }),
    offer: offer(),
  });
  expect(result.withOffer.annual.rawComponentSubtotal.status).toBe("available");
  expect(result.withoutOffer.annual.rawComponentSubtotal.status).toBe("unavailable");
  expect(result.incrementalTax.status).toBe("unavailable");
});

it.each([
  { edits: { otherIncome: "" } },
  { edits: { deductions: "" } },
  { edits: { otherIncome: "bad" } },
  { edits: { taxableWithOffer: "100000.5" } },
  { edits: { resident: "no" } },
  { edits: { resident: "" } },
  { edits: { adult: "" } },
  { edits: { standardDeduction: "", otherIncome: "0" } },
  { edits: { standardDeduction: "yes", otherLabourIncome: "" } },
  { edits: { standardDeduction: "yes", otherSpecifiedDeductions: "" } },
  { edits: { standardDeduction: "yes", otherLabourIncome: "100001" } },
  { edits: { standardDeduction: "yes", otherSpecifiedDeductions: "1" } },
] satisfies { edits: TaxFields }[])(
  "retains missing, invalid and unsupported profile states",
  ({ edits }) => {
    expect(
      calculateProfileTax({ year: "2026-27", profile: profile(edits), offer: offer() })
        .incrementalTax.status,
    ).toBe("unavailable");
  },
);

it.each([
  { edits: { single: "no" } },
  { edits: { single: "" } },
  { edits: { medicare: "" } },
  { edits: { medicare: "exempt" } },
  { edits: { medicare: "other" } },
  { edits: { hospitalCover: "no" } },
  { edits: { studyLoan: "" } },
  { edits: { studyLoan: "yes", loanScheme: "other-or-multiple" } },
  { edits: { studyLoan: "yes", loanScheme: "" } },
  { edits: { studyLoan: "yes", loanScheme: "help", single: "no", helpEligible: "yes" } },
] satisfies { edits: TaxFields }[])(
  "does not treat partial cover or special household/loan facts as zero",
  ({ edits }) => {
    expect(
      calculateProfileTax({ year: "2025-26", profile: profile(edits), offer: offer() })
        .incrementalTax.status,
    ).toBe("unavailable");
  },
);

it("derives PAYG declarations separately without choosing a representative date or deposit count", () => {
  const input = buildPaygInput({
    profile: profile(),
    payer: {
      ordinaryPayroll: "yes",
      tfnProvided: "yes",
      threshold: "yes",
      noPaygAdjustments: "yes",
    },
    rulePeriod: "2026-july",
    period: "fortnightly",
    earnings: 2000,
  });
  expect(amount(calculatePayg(input).combined)).toBe(expected.withheld);
  expect(
    buildPaygInput({
      profile: {},
      payer: {},
      rulePeriod: "2025-july",
      period: "weekly",
      earnings: null,
    }),
  ).toMatchObject({ ordinaryEmployee: null, thresholdClaimed: null, studyLoanDeclared: null });
});
