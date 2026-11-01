import { expect, it } from "bun:test";
import { annualLeave } from "../../src/lib/calculations/annual-leave.ts";
import type { Fields } from "../../src/lib/data/model.d.ts";
import { offer } from "./package-fixture.ts";

const annualCash = 130_000;
const baseLeaveCash = 10_000;

function leaveOffer(fields: Fields) {
  return offer({
    annualLeave: "4",
    leaveOrdinaryHours: "40",
    leaveRateBasis: "salary",
    leaveLoadingBasis: "percent",
    ...fields,
  });
}

it("values established percentage loading on base leave pay without using a stale hourly amount", () => {
  const expected = { hourly: 8.75, loading: 1400, gross: 9400, balance: 587.5 };
  const result = annualLeave(
    leaveOffer({
      leaveRateBasis: "entered",
      leaveHourlyRate: "50",
      leaveLoadingPercent: "17.5",
      leaveLoadingHourly: "999",
      leaveBalanceHours: "10",
      leaveBalanceDate: "2026-10-26",
    }),
    null,
  );
  expect(result.loadingRate.amount).toBe(expected.hourly);
  expect(result.entitlementLoading.amount).toBe(expected.loading);
  expect(result.entitlementGross.amount).toBe(expected.gross);
  expect(result.balanceGross.amount).toBe(expected.balance);
});

it("keeps missing percentage loading and base pay unavailable, while accepting explicit zero", () => {
  for (const loading of ["", "-1", "Infinity", "bad"]) {
    const result = annualLeave(leaveOffer({ leaveLoadingPercent: loading }), annualCash);
    expect(result.loadingRate.amount).toBeNull();
    expect(result.entitlementBase.amount).toBe(baseLeaveCash);
  }
  const zero = annualLeave(leaveOffer({ leaveLoadingPercent: "0" }), annualCash);
  expect(zero.loadingRate.amount).toBe(0);
  expect(zero.entitlementGross.amount).toBe(baseLeaveCash);
  const unknownRate = annualLeave(
    leaveOffer({ leaveRateBasis: "", leaveLoadingPercent: "17.5" }),
    annualCash,
  );
  expect(unknownRate.loadingRate.amount).toBeNull();
});
