import { expect, it } from "bun:test";
import {
  type ComparisonInput,
  type ComparisonResult,
  calculateComparison,
} from "../../src/lib/calculations/comparison.ts";
import { calculateRepresentativePayroll } from "../../src/lib/calculations/tax/payroll.ts";
import { resolveOffer } from "../../src/lib/data/defaults.ts";
import { newRecord } from "../../src/lib/data/schema.ts";
import { offer as legacyOffer, profile as legacyProfile } from "./package-fixture.ts";
import { amount } from "./tax/fixtures.ts";

const now = "2026-10-23T00:00:00.000Z";

function freshInput(): ComparisonInput {
  const offer = newRecord("offer", "standard-offer", now);
  const profile = newRecord("profile", "profile", now);
  Object.assign(offer.fields, {
    employment: "full-time",
    amount: "100000",
    inclusion: "excludes",
    weeklyHours: "40",
    threshold: "yes",
  });
  Object.assign(profile.fields, {
    household: "single",
    hospitalCover: "yes",
    studyLoan: "no",
  });
  return {
    offer: resolveOffer(offer, newRecord("preferences", "preferences", now).fields, {}),
    profile: profile.fields,
    vehicle: {},
    year: "2026-27",
    target: false,
    oneOff: false,
    timeValue: true,
  };
}

function metric(result: ComparisonResult, label: string): number | null | undefined {
  return result.metrics.find((entry) => entry.label === label)?.amount;
}

it("calculates a new $100000 cash salary with only the relevant personal facts", () => {
  const input = freshInput();
  const original = structuredClone(input);
  const result = calculateComparison(input);
  // 99,000 taxable: 4,020 + 16,200 income tax, plus 1,980 Medicare; no MLS or loan.
  const expected = {
    deduction: 1000,
    taxable: 99_000,
    tax: 22_200,
    cash: 77_800,
    gross: 112_000,
    super: 12_000,
    netSuper: 10_200,
    netPackage: 88_000,
  };
  expect(amount(result.tax.withOffer.standardDeduction)).toBe(expected.deduction);
  expect(amount(result.tax.withoutOffer.standardDeduction)).toBe(0);
  expect(amount(result.tax.withOffer.taxableInput)).toBe(expected.taxable);
  expect(amount(result.tax.incrementalTax)).toBe(expected.tax);
  expect(metric(result, "Package value before tax and costs")).toBe(expected.gross);
  expect(metric(result, "Employer / hirer super")).toBe(expected.super);
  expect(metric(result, "Cash after tax and personal super")).toBeCloseTo(expected.cash);
  expect(metric(result, "Super contributions after ordinary fund tax")).toBe(expected.netSuper);
  expect(metric(result, "Package value after tax")).toBe(expected.netPackage);
  expect(result.tax.withOffer.annual.finalAssessment.status).toBe("unavailable");
  expect(result.notes.join(" ")).toContain("not verified personal, employer or fund facts");
  expect(input).toEqual(original);
  expect(input.offer.fields).not.toHaveProperty("periodSacrifice");
  expect(input.profile).not.toHaveProperty("standardDeduction");
});

it("passes prepared sacrifice and declarations to independent representative PAYG", () => {
  const input = freshInput();
  Object.assign(input.offer.fields, { sacrifice: "2600" });
  const result = calculateComparison(input);
  expect(result.payer).toMatchObject({
    periodSacrifice: "100",
    reportableSuperOffer: "2600",
    tfnProvided: "yes",
    ordinaryPayroll: "yes",
    noPaygAdjustments: "yes",
    regularPay: "yes",
    threshold: "yes",
  });
  const payroll = calculateRepresentativePayroll({
    year: input.year,
    annualBaseCash: result.baseCash,
    profile: result.profile,
    payer: result.payer,
  });
  // T22 scale 2: weekly equivalent 1,873.99; rounded weekly withholding 418, fortnight 836.
  const expected = { gross: 3846.15, taxable: 3746.15, withheld: 836, bank: 2910.15 };
  expect(amount(payroll.grossBaseCash)).toBe(expected.gross);
  expect(amount(payroll.taxablePay)).toBe(expected.taxable);
  expect(payroll.rulePeriods).toMatchObject([
    {
      rulePeriod: "2026-july",
      withholding: { combined: { amount: expected.withheld } },
      bankEstimate: { amount: expected.bank },
    },
  ]);
  expect(input.offer.fields).not.toHaveProperty("reportableSuperOffer");
});

it("keeps raw legacy records and their existing numerical conventions unchanged", () => {
  const input = freshInput();
  input.offer = legacyOffer();
  input.offer.fields = Object.fromEntries(
    Object.entries(input.offer.fields).filter(([key]) => key !== "estimateMode"),
  );
  input.profile = { ...legacyProfile };
  const before = structuredClone(input);
  const result = calculateComparison(input);
  const expected = { tax: 22_520, cash: 77_480 };
  expect(amount(result.tax.withOffer.standardDeduction)).toBe(0);
  expect(amount(result.tax.incrementalTax)).toBe(expected.tax);
  expect(metric(result, "Cash after tax and personal super")).toBeCloseTo(expected.cash);
  expect(result.payer).toEqual(input.offer.fields);
  expect(result.profile).toEqual(input.profile);
  expect(result.notes.join(" ")).not.toContain("Standard scenario conventions");
  expect(input).toEqual(before);
});

it("preserves saved blanks and independent gross values rather than silently applying defaults", () => {
  const input = freshInput();
  Object.assign(input.offer.fields, { periodSacrifice: "" });
  Object.assign(input.profile, { specifiedWorkDeductions: "" });
  const before = structuredClone(input);
  const result = calculateComparison(input);
  const expectedGross = 112_000;
  expect(result.payer).toHaveProperty("periodSacrifice", "");
  expect(result.profile).toHaveProperty("specifiedWorkDeductions", "");
  expect(result.tax.incrementalTax.status).toBe("unavailable");
  expect(metric(result, "Package value before tax and costs")).toBe(expectedGross);
  const payroll = calculateRepresentativePayroll({
    year: input.year,
    annualBaseCash: result.baseCash,
    profile: result.profile,
    payer: result.payer,
  });
  expect(payroll.rulePeriods[0]?.withholding.combined.status).toBe("unavailable");
  expect(input).toEqual(before);
});

it("retains explicit tax and payroll exceptions even in standard mode", () => {
  const input = freshInput();
  Object.assign(input.profile, { standardDeduction: "no" });
  Object.assign(input.offer.fields, { tfnProvided: "no" });
  const result = calculateComparison(input);
  const expectedTax = 22_520;
  expect(amount(result.tax.incrementalTax)).toBe(expectedTax);
  const payroll = calculateRepresentativePayroll({
    year: input.year,
    annualBaseCash: result.baseCash,
    profile: result.profile,
    payer: result.payer,
  });
  expect(payroll.rulePeriods[0]?.withholding.combined).toMatchObject({
    status: "unavailable",
    code: "unsupported-regime",
    reason: "TFN declaration supplied is outside this component.",
  });
});
