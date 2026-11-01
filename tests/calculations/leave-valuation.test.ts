import { expect, it } from "bun:test";
import { calculateComparison } from "../../src/lib/calculations/comparison.ts";
import { offer, profile } from "./package-fixture.ts";

const precision = 6;
const expected = {
  weeks: 4,
  hours: 152,
  gross: 11_200,
  super: 1200,
  fundTax: 180,
  netSuper: 1020,
  ordinaryHours: 1976,
  annualPackage: 145_600,
};

it.each([
  { year: "2025-26", cash: 6325, combined: 7345, headline: 109_247, total: 116_592 },
  { year: "2026-27", cash: 6395, combined: 7415, headline: 109_847.5, total: 117_262.5 },
] as const)(
  "shows leave earned and additional cash-out value separately: %j",
  ({ year, cash, combined, headline, total }) => {
    const record = offer({
      amount: "130000",
      inclusion: "excludes",
      annualLeave: "4",
      leaveOrdinaryHours: "38",
      leaveRateBasis: "salary",
      leaveLoadingBasis: "none",
    });
    const snapshot = structuredClone(record);
    const result = calculateComparison({
      offer: record,
      profile: { ...profile, standardDeduction: "yes", hospitalCover: "no", mlsLiableDays: "365" },
      vehicle: {},
      year,
      target: false,
      oneOff: false,
      timeValue: true,
    });
    const metric = (label: string) => result.metrics.find((entry) => entry.label === label)?.amount;
    expect(metric("Annual leave entitlement (weeks)")).toBe(expected.weeks);
    expect(metric("Annual leave entitlement (hours)")).toBe(expected.hours);
    expect(metric("Annual leave: base pay plus super")).toBeCloseTo(expected.gross, precision);
    expect(metric("Ordinary leave base pay plus super per hour")).toBeCloseTo(
      expected.annualPackage / expected.ordinaryHours,
      precision,
    );
    expect(metric("Hypothetical annual leave cash-out after tax")).toBeCloseTo(cash, precision);
    expect(metric("Hypothetical leave cash-out: employer super")).toBeCloseTo(
      expected.super,
      precision,
    );
    expect(metric("Hypothetical leave cash-out: ordinary fund tax")).toBeCloseTo(
      expected.fundTax,
      precision,
    );
    expect(metric("Hypothetical leave cash-out: net super")).toBeCloseTo(
      expected.netSuper,
      precision,
    );
    expect(metric("Hypothetical leave cash-out: net total")).toBeCloseTo(combined, precision);
    expect(metric("Package value after tax, commuting costs and time")).toBeCloseTo(
      headline,
      precision,
    );
    expect(metric("Package value including hypothetical leave cash-out")).toBeCloseTo(
      total,
      precision,
    );
    expect(metric("Package value before tax and costs")).toBe(expected.annualPackage);
    expect(record).toEqual(snapshot);
  },
);

it.each([
  { timeValue: true, headline: 108_243.067_307_692, total: 115_713.067_307_692 },
  { timeValue: false, headline: 111_075, total: 118_545 },
])("adds cash-out while retaining the original commuting valuation: %j", (expectedValue) => {
  const record = offer({
    amount: "130000",
    inclusion: "excludes",
    annualLeave: "4",
    leaveOrdinaryHours: "38",
    leaveRateBasis: "salary",
    leaveLoadingBasis: "none",
    energy: "none",
    tripCharges: "5",
  });
  record.items = {
    roster: [
      {
        id: "shift",
        fields: { day: "1", start: "09:00", hours: "8", journeys: "1", place: "onsite" },
      },
    ],
    perks: [{ id: "perk", fields: { amount: "200", frequency: "annual" } }],
  };
  const result = calculateComparison({
    offer: record,
    profile,
    vehicle: {},
    year: "2026-27",
    target: false,
    oneOff: false,
    timeValue: expectedValue.timeValue,
  });
  const metric = (label: string) => result.metrics.find((entry) => entry.label === label);
  // Existing $111,140 cash + super, $200 perks, 53 trips at $5, and $7,470 extra cash-out.
  expect(metric("Package value after tax, commuting costs and time")?.amount).toBeCloseTo(
    expectedValue.headline,
    precision,
  );
  expect(metric("Package value including hypothetical leave cash-out")?.amount).toBeCloseTo(
    expectedValue.total,
    precision,
  );
  expect(metric("Package value including hypothetical leave cash-out")?.lowerIsBetter).toBe(false);
});
