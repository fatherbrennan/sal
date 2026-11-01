import { expect, it } from "bun:test";
import {
  type ComparisonInput,
  calculateComparison,
} from "../../src/lib/calculations/comparison.ts";
import { bonus, offer, profile } from "./package-fixture.ts";
import { amount } from "./tax/fixtures.ts";

function input(): ComparisonInput {
  const record = offer({ amount: "105000" });
  record.items = { earnings: [bonus({ amount: "10000" })] };
  return {
    offer: record,
    profile,
    vehicle: {},
    year: "2026-27",
    target: false,
    oneOff: false,
    timeValue: true,
  };
}
function metric(source: ComparisonInput, label: string) {
  return calculateComparison(source).metrics.find((entry) => entry.label === label)?.amount;
}
const expected = {
  baseCash: 93_750,
  baseHourly: 45.07,
  bonusCash: 8928.57,
  baseSuper: 11_250,
  bonusSuper: 1071.43,
  cashHourly: 49.36,
  packageHourly: 55.29,
  baseTax: 20_520,
  baseNet: 73_230,
  cappedLabourDeduction: 700,
  cappedScenarioBaseCash: 267_857.142_857,
};

it("separates the $105000 inclusive base from the $10000 inclusive annual bonus", () => {
  const source = input();
  expect(metric(source, "Annual base cash before deductions")).toBeCloseTo(expected.baseCash);
  expect(metric(source, "Base cash per paid hour")).toBeCloseTo(expected.baseHourly);
  expect(metric(source, "Base employer super")).toBeCloseTo(expected.baseSuper);
  expect(metric(source, "Selected bonus / commission cash")).toBeCloseTo(expected.bonusCash);
  expect(metric(source, "Selected bonus / commission super")).toBeCloseTo(expected.bonusSuper);
  expect(metric(source, "Cash before tax per paid hour")).toBeCloseTo(expected.cashHourly);
  expect(metric(source, "Package value before tax per paid hour")).toBeCloseTo(
    expected.packageHourly,
  );
  expect(calculateComparison(source).scenario.baseOnly).toBe(false);
});

it("recomputes base-only tax without changing the offer or prorating bonus-inclusive tax", () => {
  const source = input();
  const original = structuredClone(source.offer);
  source.baseOnly = true;
  const result = calculateComparison(source);
  expect(result.scenario.baseOnly).toBe(true);
  expect(metric(source, "Cash pay / revenue before deductions")).toBeCloseTo(expected.baseCash);
  expect(metric(source, "Incremental annual tax component estimate")).toBeCloseTo(expected.baseTax);
  expect(metric(source, "Cash after tax and personal super")).toBeCloseTo(expected.baseNet);
  expect(metric(source, "Selected bonus / commission cash")).toBe(0);
  expect(source.offer).toEqual(original);
});

it("recomputes linked standard deductions at the base-only eligible-income boundary", () => {
  const source = input();
  source.offer.fields = { ...source.offer.fields, amount: "700", inclusion: "excludes" };
  source.offer.items = { earnings: [bonus({ amount: "1100", inclusion: "excludes" })] };
  source.profile = { ...profile, standardDeduction: "yes" };
  source.baseOnly = true;
  const deduction = calculateComparison(source).tax.withOffer.standardDeduction;
  expect(amount(deduction)).toBe(expected.cappedLabourDeduction);
});

it.each(["yes", ""])(
  "blocks base decomposition for embedded or unclassified extras: %s",
  (included) => {
    const source = input();
    source.offer.items = { earnings: [bonus({ included })] };
    expect(metric(source, "Annual base cash before deductions")).toBeNull();
    expect(metric(source, "Base cash per paid hour")).toBeNull();
    source.baseOnly = true;
    expect(metric(source, "Cash pay / revenue before deductions")).toBeNull();
    expect(metric(source, "Package value before tax and costs")).toBeNull();
    expect(metric(source, "Incremental annual tax component estimate")).toBeNull();
  },
);

it("excludes separate bonus classification guards only from base-only tax", () => {
  const source = input();
  source.offer.items = { earnings: [bonus({ taxClass: "" })] };
  expect(metric(source, "Incremental annual tax component estimate")).toBeNull();
  source.baseOnly = true;
  expect(metric(source, "Incremental annual tax component estimate")).toBeCloseTo(expected.baseTax);
});

it("keeps an inclusive capped base allocation unknown in the combined scenario", () => {
  const source = input();
  source.offer.fields = { ...source.offer.fields, amount: "300000" };
  source.offer.items = { earnings: [bonus({ amount: "100000" })] };
  expect(metric(source, "Annual base cash before deductions")).toBeNull();
  expect(metric(source, "Base employer super")).toBeNull();
  expect(metric(source, "Selected bonus / commission super")).toBeNull();
  expect(calculateComparison(source).baseCash).toBeNull();
  source.baseOnly = true;
  expect(metric(source, "Annual base cash before deductions")).toBeCloseTo(
    expected.cappedScenarioBaseCash,
  );
});
