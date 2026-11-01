import { expect, it } from "bun:test";
import { calculateComparison } from "../../src/lib/calculations/comparison.ts";
import { offer, profile } from "./package-fixture.ts";

const expectedHours = 152;
const grossPayment = 10_000;
const unchangedPackage = 145_600;
const precision = 6;

it.each([
  { year: "2025-26", net: 6325 },
  { year: "2026-27", net: 6395 },
] as const)(
  "compares a full-year leave cash-out separately from the package: %j",
  ({ year, net }) => {
    const record = offer({
      amount: "130000",
      inclusion: "excludes",
      annualLeave: "4",
      leaveOrdinaryHours: "38",
      leaveRateBasis: "salary",
      leaveLoadingBasis: "none",
    });
    const before = structuredClone(record);
    const result = calculateComparison({
      offer: record,
      profile: {
        ...profile,
        standardDeduction: "yes",
        household: "single",
        hospitalCover: "no",
        mlsLiableDays: "365",
      },
      vehicle: {},
      year,
      target: false,
      oneOff: false,
      timeValue: true,
    });
    const amounts = Object.fromEntries(result.metrics.map(({ label, amount }) => [label, amount]));
    expect(amounts["Annual leave entitlement (hours)"]).toBe(expectedHours);
    expect(amounts["Annual entitlement: gross illustrative value"]).toBeCloseTo(
      grossPayment,
      precision,
    );
    expect(amounts["Hypothetical annual leave cash-out after tax"]).toBeCloseTo(net, precision);
    expect(amounts["Package value before tax and costs"]).toBe(unchangedPackage);
    expect(record).toEqual(before);
  },
);
