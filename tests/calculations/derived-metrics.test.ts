import { expect, it } from "bun:test";
import { calculateComparison } from "../../src/lib/calculations/comparison.ts";
import { comparisonInsights } from "../../src/lib/calculations/comparison-insights.ts";
import { bonus, offer, profile } from "./package-fixture.ts";

it("derives commute burden, remote share and net package per paid hour", () => {
  const record = offer();
  record.items = {
    roster: [
      {
        id: "office",
        fields: { day: "1", start: "09:00", hours: "8", journeys: "1", place: "onsite" },
      },
      {
        id: "home",
        fields: { day: "2", start: "09:00", hours: "8", journeys: "0", place: "remote" },
      },
    ],
  };
  const result = calculateComparison({
    offer: record,
    profile,
    vehicle: { energy: "fuel", consumption: "8", energyPrice: "2" },
    year: "2026-27",
    target: false,
    oneOff: false,
    timeValue: true,
  });
  const amounts = Object.fromEntries(result.metrics.map(({ label, amount }) => [label, amount]));
  const expected = {
    remote: 416,
    hours: 893,
    share: 49.523_809_52,
    commuteShare: 5.935_050_39,
    cost: 6.4,
    hourly: 42.153_846_15,
    incomeTax: 20_520,
    medicare: 2000,
  };
  expect(amounts["Remote worked hours"]).toBe(expected.remote);
  expect(amounts["Remote share of worked hours"]).toBeCloseTo(expected.share);
  expect(amounts["Calendar work + travel hours"]).toBe(expected.hours);
  expect(amounts["Commute share of work + travel hours"]).toBeCloseTo(expected.commuteShare);
  expect(amounts["Commute cost / broader estimate per return journey"]).toBeCloseTo(expected.cost);
  expect(amounts["Package value after tax per paid hour"]).toBeCloseTo(expected.hourly);
  expect(amounts["Offer-attributed income tax after LITO estimate"]).toBe(expected.incomeTax);
  expect(amounts["Offer-attributed Medicare levy estimate"]).toBe(expected.medicare);
  expect(amounts["Offer-attributed Medicare levy surcharge estimate"]).toBe(0);
  expect(amounts["Offer-attributed HELP repayment estimate"]).toBe(0);
});

it("preserves independent components and never divides by unknown or zero hours", () => {
  const record = offer({
    sacrifice: "1000",
    reportableSuperOffer: "0",
    reportableSuperSameYear: "yes",
  });
  const result = calculateComparison({
    offer: record,
    profile,
    vehicle: {},
    year: "2026-27",
    target: false,
    oneOff: false,
    timeValue: true,
  });
  const amounts = Object.fromEntries(result.metrics.map(({ label, amount }) => [label, amount]));
  const expected = { incomeTax: 20_220, medicare: 1980 };
  expect(amounts["Offer-attributed income tax after LITO estimate"]).toBe(expected.incomeTax);
  expect(amounts["Offer-attributed Medicare levy estimate"]).toBe(expected.medicare);
  expect(amounts["Offer-attributed Medicare levy surcharge estimate"]).toBeNull();
  expect(amounts["Offer-attributed HELP repayment estimate"]).toBeNull();
  expect(amounts["Remote worked hours"]).toBe(0);
  expect(amounts["Remote share of worked hours"]).toBeNull();
  expect(amounts["Commute cost / broader estimate per return journey"]).toBeNull();
  expect(amounts["Commute share of work + travel hours"]).toBeNull();
});

it("subtracts without-offer components and preserves unsupported target income", () => {
  const record = offer({ amount: "10000", inclusion: "excludes" });
  const source = {
    offer: record,
    profile: { ...profile, otherIncome: "50000" },
    vehicle: {},
    year: "2025-26",
    target: false,
    oneOff: false,
    timeValue: false,
  } as const;
  const guaranteed = calculateComparison(source);
  const expected = { incomeTax: 3150, medicare: 200 };
  expect(
    guaranteed.metrics.find(
      ({ label }) => label === "Offer-attributed income tax after LITO estimate",
    )?.amount,
  ).toBe(expected.incomeTax);
  expect(
    guaranteed.metrics.find(({ label }) => label === "Offer-attributed Medicare levy estimate")
      ?.amount,
  ).toBe(expected.medicare);
  record.items = { earnings: [bonus({ certainty: "target", taxClass: "other" })] };
  const target = calculateComparison({ ...source, target: true });
  const upside = comparisonInsights(target, undefined, guaranteed, target);
  expect(upside.find(({ label }) => label === "Target upside: cash after tax")?.amount).toBeNull();
  expect(
    upside.find(({ label }) => label === "Target upside: cash before tax")?.amount,
  ).not.toBeNull();
});
