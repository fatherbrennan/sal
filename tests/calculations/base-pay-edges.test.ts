import { expect, it } from "bun:test";
import { baseOnlyRemuneration } from "../../src/lib/calculations/base-pay.ts";
import { calculateComparison } from "../../src/lib/calculations/comparison.ts";
import { bonus, offer, profile } from "./package-fixture.ts";

function input() {
  return {
    offer: offer({ amount: "90000", inclusion: "excludes" }),
    profile,
    vehicle: {},
    year: "2026-27" as const,
    target: false,
    oneOff: false,
    timeValue: false,
  };
}
const expected = {
  baseCash: 90_000,
  baseSuper: 10_800,
  cappedSuper: 32_499.6,
  baseNet: 70_680,
  withBonusNet: 110_430,
  targetCash: 100_000,
  contractorRevenue: 90_000,
};

it("recalculates the progressive rate boundary instead of allocating total take-home proportionally", () => {
  const source = input();
  source.offer.items = { earnings: [bonus({ amount: "60000", inclusion: "excludes" })] };
  const base = calculateComparison({ ...source, baseOnly: true });
  const combined = calculateComparison(source);
  const label = "Cash after tax and personal super";
  expect(base.metrics.find((metric) => metric.label === label)?.amount).toBe(expected.baseNet);
  expect(combined.metrics.find((metric) => metric.label === label)?.amount).toBe(
    expected.withBonusNet,
  );
});

it("retains separate target and one-off scenarios while base-only excludes both", () => {
  const source = input();
  source.offer.items = {
    earnings: [
      bonus({ amount: "10000", inclusion: "excludes", certainty: "target", recurrence: "once" }),
    ],
  };
  const combined = calculateComparison({ ...source, target: true, oneOff: true });
  const base = calculateComparison({ ...source, target: true, oneOff: true, baseOnly: true });
  const label = "Cash pay / revenue before deductions";
  expect(combined.metrics.find((metric) => metric.label === label)?.amount).toBe(
    expected.targetCash,
  );
  expect(base.metrics.find((metric) => metric.label === label)?.amount).toBe(expected.baseCash);
  expect(base.scenario).toEqual({ target: true, oneOff: true, baseOnly: true });
});

it("preserves sole-trader revenue and refuses employee bonus rows even in base-only mode", () => {
  const record = offer({ employment: "sole-trader", amount: "90000", gst: "exclusive" });
  expect(baseOnlyRemuneration(record, "2026-27").cash).toBe(expected.contractorRevenue);
  record.items = { earnings: [bonus()] };
  expect(baseOnlyRemuneration(record, "2026-27").cash).toBeNull();
});

it("does not present an embedded bonus quote as ordinary base payroll", () => {
  const source = input();
  source.offer.items = { earnings: [bonus({ included: "yes" })] };
  expect(calculateComparison(source).baseCash).toBeNull();
});

it("keeps exclusive base cash known when capped component super cannot be allocated", () => {
  const source = input();
  source.offer.fields = { ...source.offer.fields, amount: "300000" };
  source.offer.items = { earnings: [bonus({ amount: "10000", inclusion: "excludes" })] };
  const { metrics } = calculateComparison(source);
  const baseCash = 300_000;
  expect(metrics.find(({ label }) => label === "Annual base cash before deductions")?.amount).toBe(
    baseCash,
  );
  expect(metrics.find(({ label }) => label === "Base employer super")?.amount).toBeNull();
  expect(metrics.find(({ label }) => label === "Employer / hirer super")?.amount).toBe(
    expected.cappedSuper,
  );
});

it("attributes the known base cap when no bonus cash is selected", () => {
  const source = input();
  source.offer.fields = { ...source.offer.fields, amount: "300000" };
  source.offer.items = { earnings: [bonus({ certainty: "target" })] };
  expect(
    calculateComparison(source).metrics.find(({ label }) => label === "Base employer super")
      ?.amount,
  ).toBe(expected.cappedSuper);
});

it("preserves explicit unknown super inclusion and paid hours in the base-only scenario", () => {
  const source = input();
  source.offer.fields = { ...source.offer.fields, inclusion: "", weeklyHours: "" };
  const result = calculateComparison({ ...source, baseOnly: true });
  expect(result.baseCash).toBeNull();
  expect(
    result.metrics.find(({ label }) => label === "Base cash per paid hour")?.amount,
  ).toBeNull();
});

it("keeps uncapped separate base amounts stable when bonus details are incomplete", () => {
  const source = input();
  source.offer.items = { earnings: [bonus({ amount: "", taxClass: "", eligible: "" })] };
  const result = calculateComparison({ ...source, baseOnly: true });
  expect(result.baseCash).toBe(expected.baseCash);
  expect(result.metrics.find(({ label }) => label === "Base employer super")?.amount).toBe(
    expected.baseSuper,
  );
});

it("keeps confirmed zero base super separate from an eligible capped bonus", () => {
  const source = input();
  source.offer.fields = { ...source.offer.fields, superEligible: "no" };
  source.offer.items = { earnings: [bonus({ amount: "400000", inclusion: "excludes" })] };
  const result = calculateComparison(source);
  expect(result.metrics.find(({ label }) => label === "Base employer super")?.amount).toBe(0);
  expect(
    result.metrics.find(({ label }) => label === "Selected bonus / commission super")?.amount,
  ).toBe(expected.cappedSuper);
});

it("does not allocate statutory base super when an unknown bonus may consume the cap", () => {
  const source = input();
  source.offer.items = { earnings: [bonus({ amount: "", inclusion: "excludes" })] };
  const result = calculateComparison(source);
  expect(result.metrics.find(({ label }) => label === "Base employer super")?.amount).toBeNull();
  source.offer.fields = { ...source.offer.fields, superLimit: "uncapped" };
  const uncapped = calculateComparison(source);
  expect(uncapped.metrics.find(({ label }) => label === "Base employer super")?.amount).toBe(
    expected.baseSuper,
  );
});
