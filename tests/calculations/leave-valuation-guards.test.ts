import { expect, it } from "bun:test";
import { calculateComparison } from "../../src/lib/calculations/comparison.ts";
import type { Fields } from "../../src/lib/data/model.d.ts";
import { bonus, offer, profile } from "./package-fixture.ts";

function input(fields: Fields = {}, personal: Fields = {}) {
  return {
    offer: offer({
      amount: "130000",
      inclusion: "excludes",
      annualLeave: "4",
      leaveOrdinaryHours: "38",
      leaveRateBasis: "salary",
      leaveLoadingBasis: "none",
      ...fields,
    }),
    profile: { ...profile, ...personal },
    vehicle: {},
    year: "2026-27",
    target: false,
    oneOff: false,
    timeValue: true,
  } as const;
}

it.each([
  {
    fields: { sacrifice: "16000", reportableSuperOffer: "16000" },
    personal: {},
    reason: "annual cap",
  },
  { fields: {}, personal: { reportableSuper: "16000" }, reason: "annual cap" },
  { fields: { amount: "220000" }, personal: {}, reason: "Division 293" },
  { fields: { amount: "250000" }, personal: {}, reason: "Division 293" },
  { fields: {}, personal: { investmentLoss: "100000" }, reason: "Division 293" },
] as const)(
  "withholds affected cash and super when additional tax is not established: %j",
  ({ fields, personal, reason }) => {
    const result = calculateComparison(input(fields, personal));
    expect(result.leaveValuation.payoutTotal.amount).toBeNull();
    expect(
      result.metrics.find(
        ({ label }) => label === "Package value including hypothetical leave cash-out",
      )?.amount,
    ).toBeNull();
    expect(result.leaveValuation.payoutCash.reason).toContain(reason);
    expect(result.leaveValuation.payoutNetSuper.reason).toContain(reason);
    expect(result.leave.entitlementGross.amount).not.toBeNull();
  },
);

it("withholds the combined total when only the headline is unknown", () => {
  const source = input();
  source.offer.items = { perks: [{ id: "unknown", fields: { amount: "", frequency: "annual" } }] };
  const result = calculateComparison(source);
  expect(result.leaveValuation.payoutTotal.amount).not.toBeNull();
  expect(
    result.metrics.find(
      ({ label }) => label === "Package value including hypothetical leave cash-out",
    )?.amount,
  ).toBeNull();
});

it("checks contribution caps at the boundary without double-counting offer reportable super", () => {
  const source = input(
    { sacrifice: "1000", reportableSuperOffer: "1000" },
    { reportableSuper: "14700" },
  );
  const cap = 32_500;
  const atCap = calculateComparison(source);
  expect(atCap.leaveValuation.screen.contributions).toBe(cap);
  expect(atCap.leaveValuation.payoutTotal.amount).not.toBeNull();
  const over = calculateComparison({
    ...source,
    profile: { ...source.profile, reportableSuper: "14700.01" },
  });
  expect(over.leaveValuation.payoutTotal.amount).toBeNull();
  const personal = calculateComparison(input({ personalSuper: "20000" }));
  const concessional = 16_800;
  expect(personal.leaveValuation.screen.contributions).toBe(concessional);
  expect(personal.leaveValuation.payoutTotal.amount).not.toBeNull();
});

it("keeps gross values and independent cash when only fund treatment is unknown", () => {
  const source = input({ estimateMode: "original", ordinaryFund: "" });
  const result = calculateComparison(source);
  expect(result.leaveValuation.payoutCash.amount).not.toBeNull();
  expect(result.leaveValuation.payoutSuper.amount).not.toBeNull();
  expect(result.leaveValuation.payoutNetSuper.amount).toBeNull();
  expect(result.leaveValuation.payoutSuperTax.reason).toContain("ordinary taxed");
});

it("preserves independent net super when the new cash-tax endpoint is unsupported", () => {
  const result = calculateComparison(input({ amount: "61905.08" }));
  const expectedNetSuper = 485.716_781_538_461_5;
  expect(result.leaveValuation.payoutCash.amount).toBeNull();
  expect(result.leaveValuation.payoutNetSuper.amount).toBeCloseTo(expectedNetSuper);
  expect(result.leaveValuation.payoutTotal.amount).toBeNull();
});

it("does not infer net cash from unknown contractual super reporting", () => {
  const result = calculateComparison(input({ superRate: "15", superLimit: "uncapped" }));
  expect(result.leaveValuation.payoutCash.amount).toBeNull();
  expect(result.leaveValuation.payoutTotal.reason).toContain("reportable");
  expect(result.leaveValuation.earnedGross.amount).not.toBeNull();
});

it("does not inflate earned leave with selected bonuses, but taxes the extra payout against them", () => {
  const source = input();
  source.offer.items = { earnings: [bonus({ amount: "10000", inclusion: "excludes" })] };
  const selected = calculateComparison(source);
  const base = calculateComparison({ ...source, baseOnly: true });
  const gross = 11_200;
  expect(selected.leaveValuation.earnedGross.amount).toBeCloseTo(gross);
  expect(base.leaveValuation.earnedGross.amount).toBeCloseTo(gross);
  expect(selected.leaveCashOut.extraTax).not.toBe(base.leaveCashOut.extraTax);
});

it("screens Division 293 even when cash-out SG is zero", () => {
  const high = calculateComparison(input({ amount: "300000" }));
  expect(high.leaveValuation.payoutSuper.amount).toBe(0);
  expect(high.leaveValuation.payoutTotal.amount).toBeNull();
  expect(high.leaveValuation.screen.reason).toContain("Division 293");
});

it("values additional entitlement without adding it to the normal package", () => {
  const four = calculateComparison(input());
  const six = calculateComparison(input({ annualLeave: "6" }));
  const expected = { hours: 228, gross: 16_800, super: 1800, netSuper: 1530 };
  expect(six.leave.entitlementHours.amount).toBe(expected.hours);
  expect(six.leaveValuation.earnedGross.amount).toBeCloseTo(expected.gross);
  expect(six.leaveValuation.payoutSuper.amount).toBeCloseTo(expected.super);
  expect(six.leaveValuation.payoutNetSuper.amount).toBeCloseTo(expected.netSuper);
  expect(six.metrics.find(({ label }) => label === "Package value before tax and costs")).toEqual(
    four.metrics.find(({ label }) => label === "Package value before tax and costs"),
  );
});

it.each(["hour", "day"])(
  "rejects a stale salary leave basis after switching the quote to %s",
  (unit) => {
    const result = calculateComparison(input({ unit, amount: "50", paidUnits: "1976" }));
    expect(result.leave.ordinaryRate.amount).toBeNull();
    expect(result.leaveValuation.superHourly.amount).toBeNull();
    expect(result.leaveValuation.earnedSuper.amount).toBeNull();
  },
);
