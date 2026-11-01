import type { OfferTaxAmounts, TaxFields } from "../../../src/lib/calculations/tax/types.d.ts";

function profile(overrides: TaxFields = {}): TaxFields {
  return {
    resident: "yes",
    adult: "yes",
    assessmentComplete: "yes",
    otherIncome: "0",
    deductions: "0",
    otherLabourIncome: "0",
    otherSpecifiedDeductions: "0",
    standardDeduction: "no",
    medicare: "ordinary",
    ordinaryMls: "yes",
    single: "yes",
    hospitalCover: "yes",
    reportableBenefits: "0",
    reportableSuper: "0",
    investmentLoss: "0",
    foreignIncome: "0",
    studyLoan: "no",
    ...overrides,
  };
}

function offer(overrides: Partial<OfferTaxAmounts> = {}): OfferTaxAmounts {
  return {
    assessableIncome: 100_000,
    deductions: 0,
    assessableLabourIncome: 100_000,
    specifiedWorkDeductions: 0,
    reportableSuper: 0,
    reportableBenefits: 0,
    ...overrides,
  };
}

export { offer, profile };
