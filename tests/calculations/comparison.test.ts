import { expect, it } from "bun:test";
import {
  type ComparisonInput,
  calculateComparison,
} from "../../src/lib/calculations/comparison.ts";
import { bonus, offer, profile } from "./package-fixture.ts";

function input(): ComparisonInput {
  return {
    offer: offer(),
    profile,
    vehicle: {},
    year: "2026-27",
    target: false,
    oneOff: false,
    timeValue: true,
  };
}
function metric(source: ComparisonInput, label: string): number | null | undefined {
  return calculateComparison(source).metrics.find((entry) => entry.label === label)?.amount;
}
it("presents package totals and cash after costs before the detailed components", () => {
  const headlineCount = 4;
  expect(
    calculateComparison(input())
      .metrics.slice(0, headlineCount)
      .map(({ label }) => label),
  ).toEqual([
    "Package value before tax and costs",
    "Package value after tax",
    "Cash after tax and personal super",
    "Cash after tax and job costs",
  ]);
});
it("derives the user's $100000 inclusive salary and $10000 inclusive annual bonus hourly views", () => {
  const source = input();
  source.offer = offer({ amount: "100000" });
  const expectedHourly = { base: 48.076_923, withBonus: 52.884_615 };
  expect(metric(source, "Package value before tax per paid hour")).toBeCloseTo(expectedHourly.base);
  source.offer.items = { earnings: [bonus({ amount: "10000" })] };
  expect(metric(source, "Package value before tax per paid hour")).toBeCloseTo(
    expectedHourly.withBonus,
  );
});
const expected = {
  incomeTax: 22_520,
  netCash: 77_480,
  netEmployerSuper: 10_200,
  netPackage: 87_680,
  netHourly: 37.25,
  grossHourly: 53.846_153,
  cashAfterPersonalSuper: 76_480,
  fundAfterPersonalSuper: 11_200,
  netPackageWithPerk: 87_880,
  targetCash: 84_280,
  contractorTax: 19_320,
  contractorNet: 70_680,
};

it("reconciles $112000 inclusive remuneration to $100000 cash, $12000 super and estimated tax", () => {
  expect(metric(input(), "Incremental annual tax component estimate")).toBe(expected.incomeTax);
  expect(metric(input(), "Cash after tax and personal super")).toBeCloseTo(expected.netCash);
  expect(metric(input(), "Super contributions after ordinary fund tax")).toBeCloseTo(
    expected.netEmployerSuper,
  );
  expect(metric(input(), "Package value after tax")).toBeCloseTo(expected.netPackage);
  expect(metric(input(), "Cash after tax per paid hour")).toBeCloseTo(expected.netHourly);
  expect(metric(input(), "Package value before tax per paid hour")).toBeCloseTo(
    expected.grossHourly,
  );
});
it("keeps personal super a transfer, and perks an additive personal value", () => {
  const source = input();
  source.offer.fields = { ...source.offer.fields, personalSuper: "1000" };
  source.offer.items = { perks: [{ id: "perk", fields: { amount: "200", frequency: "annual" } }] };
  expect(metric(source, "Cash after tax and personal super")).toBeCloseTo(
    expected.cashAfterPersonalSuper,
  );
  expect(metric(source, "Super contributions after ordinary fund tax")).toBeCloseTo(
    expected.fundAfterPersonalSuper,
  );
  expect(metric(source, "Package value after tax")).toBeCloseTo(expected.netPackageWithPerk);
});
it("recalculates target and one-off totals jointly while retaining recurring results", () => {
  const source = input();
  source.offer.items = { earnings: [bonus({ certainty: "target", recurrence: "once" })] };
  expect(metric(source, "Cash after tax and personal super")).toBeCloseTo(expected.netCash);
  source.target = true;
  source.oneOff = true;
  expect(metric(source, "Cash after tax and personal super")).toBeCloseTo(expected.targetCash);
});
it("does not double-deduct contractor cash expenses in the tax assessment", () => {
  const source = input();
  source.offer = offer({
    employment: "sole-trader",
    amount: "110000",
    gst: "inclusive",
    businessCosts: "10000",
    businessDeductions: "10000",
    eligibleLabour: "0",
    specifiedDeductions: "0",
    contractorSuper: "0",
    contractorPersonalSuper: "0",
  });
  expect(metric(source, "Incremental annual tax component estimate")).toBe(expected.contractorTax);
  expect(metric(source, "Cash after tax and personal super")).toBeCloseTo(expected.contractorNet);
  source.offer.fields = { ...source.offer.fields, businessDeductions: "120000" };
  source.profile = { ...profile, otherIncome: "50000" };
  expect(metric(source, "Incremental annual tax component estimate")).toBeNull();
});
it("keeps travel adjustments separate and supports explicit tax-profile overrides", () => {
  const source = input();
  source.timeValue = false;
  source.offer.items = {
    taxOverride: [{ id: "override", fields: { otherIncome: "10000", adult: "yes" } }],
  };
  expect(metric(source, "Commute-time value at package before tax")).toBe(0);
  expect(metric(source, "Commute-time value at cash + super after tax")).toBe(0);
  expect(calculateComparison(source).profile).toMatchObject({
    otherIncome: "10000",
    resident: "yes",
  });
  source.profile = {};
  expect(metric(source, "Cash after tax and personal super")).toBeNull();
});
it("preserves unknown tax overrides until inheritance is explicitly restored", () => {
  const source = input();
  source.profile = { ...profile, otherIncome: "10000" };
  source.offer.items = { taxOverride: [{ id: "override", fields: { otherIncome: "" } }] };
  expect(calculateComparison(source).profile).toMatchObject({ otherIncome: "" });
  expect(metric(source, "Cash after tax and personal super")).toBeNull();
  expect(metric(source, "Package value before tax and costs")).not.toBeNull();
  source.offer.items = { taxOverride: [{ id: "override", fields: { otherIncome: "0" } }] };
  expect(calculateComparison(source).profile).toMatchObject({ otherIncome: "0" });
  source.offer.items = { taxOverride: [{ id: "override", fields: {} }] };
  expect(calculateComparison(source).profile).toMatchObject({ otherIncome: "10000" });
});
it("blocks only scenarios that include an unverified payment tax class", () => {
  const source = input();
  source.offer.items = { earnings: [bonus({ certainty: "target", taxClass: "other" })] };
  expect(metric(source, "Incremental annual tax component estimate")).toBe(expected.incomeTax);
  source.target = true;
  expect(metric(source, "Incremental annual tax component estimate")).toBeNull();
  expect(metric(source, "Package value before tax and costs")).not.toBeNull();
});
