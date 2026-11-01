import { expect, it } from "bun:test";
import { annualLeave } from "../../src/lib/calculations/annual-leave.ts";
import { cashOutSuper } from "../../src/lib/calculations/leave-super.ts";
import { earnedLeave } from "../../src/lib/calculations/leave-valuation.ts";
import { remuneration } from "../../src/lib/calculations/remuneration.ts";
import { offer } from "./package-fixture.ts";

const baseCash = 130_000;
const baseSuper = 15_600;
const precision = 6;
const record = offer({
  amount: "130000",
  inclusion: "excludes",
  annualLeave: "4",
  leaveOrdinaryHours: "38",
  leaveRateBasis: "salary",
  leaveLoadingBasis: "none",
});
const leave = annualLeave(record, baseCash);
const quote = remuneration(record, "2026-27", false, false);

it.each([
  { year: "2025-26", earnings: 130_000, even: "yes", expected: 1200 },
  { year: "2025-26", earnings: 240_000, even: "yes", expected: 300 },
  { year: "2025-26", earnings: 250_000, even: "yes", expected: 0 },
  { year: "2025-26", earnings: 50_000, even: "", expected: 1200 },
  { year: "2026-27", earnings: 270_000, even: "", expected: 99.6 },
  { year: "2026-27", earnings: 270_830, even: "", expected: 0 },
] as const)(
  "applies the additional payment to its own SG headroom: %j",
  ({ year, earnings, even, expected }) => {
    const result = cashOutSuper(
      leave,
      { ...quote, eligible: earnings },
      { ...record.fields, evenSuper: even },
      year,
    );
    expect(result.gross.amount).toBeCloseTo(expected, precision);
    expect(result.reportingKnown).toBe(true);
  },
);

it("does not invent a quarter, loading treatment or additional reportable super", () => {
  const unknownQuarter = cashOutSuper(leave, quote, { ...record.fields, evenSuper: "" }, "2025-26");
  expect(unknownQuarter.gross.amount).toBeNull();
  expect(unknownQuarter.gross.reason).toContain("quarter");
  const loading = { ...leave, loadingRate: { amount: 1, reason: "" } };
  expect(cashOutSuper(loading, quote, record.fields, "2026-27").gross.reason).toContain("loading");
  const exhausted = { ...quote, eligible: 270_830 };
  expect(cashOutSuper(loading, exhausted, record.fields, "2026-27").gross.amount).toBe(0);
  for (const fields of [{ superRate: "15" }, { superEligible: "" }, { superLimit: "" }]) {
    const result = cashOutSuper(leave, quote, { ...record.fields, ...fields }, "2026-27");
    expect(result.reportingKnown).toBe(false);
    expect(result.gross.amount).toBeNull();
  }
  const overCap = { ...quote, eligible: 270_000 };
  const uncapped = cashOutSuper(
    leave,
    overCap,
    { ...record.fields, superLimit: "uncapped" },
    "2026-27",
  );
  expect(uncapped.gross.amount).toBeNull();
  expect(uncapped.reportingKnown).toBe(false);
  const unknownUncapped = cashOutSuper(
    leave,
    quote,
    { ...record.fields, superLimit: "uncapped", evenSuper: "" },
    "2025-26",
  );
  expect(unknownUncapped.reportingKnown).toBe(false);
});

it("preserves unknown and zero amounts and rejects invalid numeric inputs", () => {
  const unknown = { ...leave, entitlementGross: { amount: null, reason: "Unknown leave rate" } };
  expect(cashOutSuper(unknown, quote, record.fields, "2026-27").gross).toEqual(
    unknown.entitlementGross,
  );
  const zero = { ...leave, entitlementGross: { amount: 0, reason: "" } };
  expect(cashOutSuper(zero, quote, {}, "2026-27").gross.amount).toBe(0);
  for (const eligible of [null, Number.POSITIVE_INFINITY, -1]) {
    expect(
      cashOutSuper(leave, { ...quote, eligible }, record.fields, "2026-27").gross.amount,
    ).toBeNull();
  }
  for (const amount of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
    const invalid = { ...leave, entitlementGross: { amount, reason: "" } };
    expect(cashOutSuper(invalid, quote, record.fields, "2026-27").gross.amount).toBeNull();
  }
});

it("allocates existing base super without pretending it is extra cash-out super", () => {
  const expectedGross = 11_200;
  const expectedAllocation = 1200;
  const earned = earnedLeave(leave, record.fields, baseSuper);
  expect(earned.earnedGross.amount).toBeCloseTo(expectedGross, precision);
  expect(earned.earnedSuper.amount).toBeCloseTo(expectedAllocation, precision);
  for (const superAmount of [null, -1, Number.POSITIVE_INFINITY]) {
    expect(earnedLeave(leave, record.fields, superAmount).earnedGross.amount).toBeNull();
  }
  expect(
    earnedLeave(leave, { ...record.fields, leaveRateBasis: "entered" }, baseSuper).earnedGross
      .amount,
  ).toBeNull();
  const unknownHours = { ...leave, ordinaryHours: { amount: null, reason: "Unknown hours" } };
  expect(earnedLeave(unknownHours, record.fields, baseSuper).earnedGross.amount).toBeNull();
});
