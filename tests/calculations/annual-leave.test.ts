import { expect, it } from "bun:test";
import { annualLeave } from "../../src/lib/calculations/annual-leave.ts";
import type { Fields } from "../../src/lib/data/model.d.ts";
import { bonus, offer } from "./package-fixture.ts";

const ordinaryAnnualCash = 93_750;
const entitlementHours = 152;
const nominalCash = 7211.538_461_538_462;
const ordinaryHourlyCash = 47.444_331_983_805_67;
const extremeCashRate = 1e308;
const enteredHourlyRate = 40;
const fiveWeekHours = 190;
const sixWeekHours = 228;
const partTimeExpected = {
  hours: 76,
  base: 3040,
  loading: 190,
  gross: 3230,
  balanceBase: 400,
  balanceLoading: 25,
  balanceGross: 425,
};

function leaveOffer(fields: Fields = {}) {
  return offer({
    annualLeave: "4",
    leaveOrdinaryHours: "38",
    leaveRateBasis: "salary",
    leaveLoadingBasis: "none",
    ...fields,
  });
}

it("values confirmed ordinary annual salary separately from bonus and comparison hours", () => {
  const record = leaveOffer({ amount: "105000", weeklyHours: "40", weeks: "50" });
  Object.assign(record.items, { earnings: [bonus({ amount: "10000" })] });
  const original = structuredClone(record);
  const result = annualLeave(record, ordinaryAnnualCash);
  expect(result.entitlementHours.amount).toBe(entitlementHours);
  expect(result.ordinaryRate.amount).toBeCloseTo(ordinaryHourlyCash);
  expect(result.entitlementBase.amount).toBeCloseTo(nominalCash);
  expect(result.entitlementGross.amount).toBeCloseTo(nominalCash);
  expect(result.entitlementLoading.amount).toBe(0);
  expect(result.balanceGross.amount).toBeNull();
  expect(result.netPayout.amount).toBeNull();
  expect(record).toEqual(original);
  Object.assign(record.items, { earnings: [bonus({ amount: "50000" })] });
  expect(annualLeave(record, ordinaryAnnualCash)).toEqual(result);
});

it("values part-time entitlement and a separately dated balance with established hourly loading", () => {
  const result = annualLeave(
    leaveOffer({
      employment: "part-time",
      leaveOrdinaryHours: "19",
      leaveRateBasis: "entered",
      leaveHourlyRate: "40",
      leaveLoadingBasis: "hourly",
      leaveLoadingHourly: "2.5",
      leaveBalanceHours: "10",
      leaveBalanceDate: "2026-10-25",
    }),
    null,
  );
  expect(result.entitlementHours.amount).toBe(partTimeExpected.hours);
  expect(result.entitlementBase.amount).toBe(partTimeExpected.base);
  expect(result.entitlementLoading.amount).toBe(partTimeExpected.loading);
  expect(result.entitlementGross.amount).toBe(partTimeExpected.gross);
  expect(result.balanceBase.amount).toBe(partTimeExpected.balanceBase);
  expect(result.balanceLoading.amount).toBe(partTimeExpected.balanceLoading);
  expect(result.balanceGross.amount).toBe(partTimeExpected.balanceGross);
  expect(result.balanceDate).toBe("2026-10-25");
  expect(result.netPayout.reason).toContain("event-specific");
});

it("does not infer leave hours from comparison hours or accept invalid hours", () => {
  for (const hours of ["", "0", "-1", "Infinity", "abc"]) {
    const result = annualLeave(leaveOffer({ leaveOrdinaryHours: hours }), ordinaryAnnualCash);
    expect(result.ordinaryHours.amount).toBeNull();
    expect(result.entitlementHours.amount).toBeNull();
    expect(result.ordinaryRate.amount).toBeNull();
  }
});

it("values a confirmed 40-hour leave week without inventing extra salary", () => {
  const annualCash = 130_000;
  const expected = { hours: 160, hourly: 62.5, cash: 10_000 };
  const record = leaveOffer({ leaveOrdinaryHours: "40", weeklyHours: "38" });
  const original = structuredClone(record);
  const result = annualLeave(record, annualCash);
  expect(result.entitlementHours.amount).toBe(expected.hours);
  expect(result.ordinaryRate.amount).toBe(expected.hourly);
  expect(result.entitlementBase.amount).toBe(expected.cash);
  expect(
    annualLeave(leaveOffer({ leaveOrdinaryHours: "38" }), annualCash).entitlementBase.amount,
  ).toBeCloseTo(expected.cash);
  expect(record).toEqual(original);
});

it("uses an independent leave rate when employer leave pay differs from normal salary", () => {
  const expected = { hours: 160, cash: 8000 };
  const result = annualLeave(
    leaveOffer({ leaveOrdinaryHours: "40", leaveRateBasis: "entered", leaveHourlyRate: "50" }),
    null,
  );
  expect(result.entitlementHours.amount).toBe(expected.hours);
  expect(result.entitlementBase.amount).toBe(expected.cash);
});

it("keeps unknown entitlement, loading and unused balance distinct from entered zero", () => {
  const result = annualLeave(
    leaveOffer({
      annualLeave: "",
      leaveLoadingBasis: "",
      leaveBalanceDate: "2026-10-25",
    }),
    ordinaryAnnualCash,
  );
  expect(result.entitlementWeeks.amount).toBeNull();
  expect(result.entitlementGross.amount).toBeNull();
  expect(result.loadingRate.amount).toBeNull();
  expect(result.balanceHours.amount).toBeNull();
  const zero = annualLeave(
    leaveOffer({
      annualLeave: "0",
      leaveBalanceHours: "0",
      leaveBalanceDate: "2026-10-25",
      leaveLoadingBasis: "hourly",
      leaveLoadingHourly: "0",
    }),
    ordinaryAnnualCash,
  );
  expect(zero.entitlementGross.amount).toBeNull();
  expect(zero.balanceGross.amount).toBe(0);
  expect(zero.netPayout.amount).toBeNull();
});

it.each(["0", "2", "3.999"])(
  "does not value a full-year NES entitlement below four weeks: %s",
  (weeks) => {
    const record = leaveOffer({
      annualLeave: weeks,
      leaveBalanceHours: "10",
      leaveBalanceDate: "2026-10-25",
      leaveRateBasis: "entered",
      leaveHourlyRate: "40",
    });
    const original = structuredClone(record);
    const result = annualLeave(record, ordinaryAnnualCash);
    expect(result.entitlementWeeks.amount).toBeNull();
    expect(result.entitlementWeeks.reason).toContain("at least 4 weeks");
    expect(result.entitlementHours.amount).toBeNull();
    expect(result.entitlementBase.amount).toBeNull();
    expect(result.entitlementLoading.amount).toBeNull();
    expect(result.entitlementGross.amount).toBeNull();
    expect(result.ordinaryRate.amount).toBe(enteredHourlyRate);
    expect(result.balanceGross.amount).toBe(partTimeExpected.balanceBase);
    expect(record).toEqual(original);
  },
);

it.each([
  ["4", entitlementHours],
  ["5", fiveWeekHours],
  ["6", sixWeekHours],
] as const)("preserves an established %s-week NES entitlement", (weeks, hours) => {
  const result = annualLeave(leaveOffer({ annualLeave: weeks }), ordinaryAnnualCash);
  expect(result.entitlementWeeks.amount).toBe(Number(weeks));
  expect(result.entitlementHours.amount).toBe(hours);
});

it("requires applicable loading even when base cash is known", () => {
  for (const fields of [{ leaveLoadingBasis: "" }, { leaveLoadingBasis: "hourly" }]) {
    const result = annualLeave(leaveOffer(fields), ordinaryAnnualCash);
    expect(result.entitlementBase.amount).toBeCloseTo(nominalCash);
    expect(result.loadingRate.amount).toBeNull();
    expect(result.entitlementGross.amount).toBeNull();
  }
});

it("requires an isolated annual ordinary salary or an explicitly established leave rate", () => {
  for (const fields of [{ leaveRateBasis: "" }, { unit: "hour" }, { unit: "day" }]) {
    expect(annualLeave(leaveOffer(fields), ordinaryAnnualCash).ordinaryRate.amount).toBeNull();
  }
  for (const cash of [null, Number.NaN, Number.POSITIVE_INFINITY, -1]) {
    const result = annualLeave(leaveOffer(), cash);
    expect(result.ordinaryRate.amount).toBeNull();
    expect(result.entitlementBase.amount).toBeNull();
  }
  expect(
    annualLeave(leaveOffer({ leaveRateBasis: "entered" }), null).ordinaryRate.amount,
  ).toBeNull();
  expect(annualLeave(leaveOffer(), 0).entitlementBase.amount).toBe(0);
});

it("requires a valid balance date and never derives a balance from entitlement or leave dates", () => {
  for (const date of ["", "2026-02-30", "not-a-date"]) {
    const result = annualLeave(
      leaveOffer({ leaveBalanceHours: "20", leaveBalanceDate: date }),
      ordinaryAnnualCash,
    );
    expect(result.balanceHours.amount).toBeNull();
    expect(result.balanceDate).toBeNull();
    expect(result.balanceGross.amount).toBeNull();
  }
});

it("requires employee eligibility without imposing NES leave on casual or contractor offers", () => {
  for (const employment of ["casual", "sole-trader", ""]) {
    const result = annualLeave(
      leaveOffer({ employment, leaveEligible: "yes", ordinaryLeave: "yes" }),
      ordinaryAnnualCash,
    );
    expect(result.eligible).toBe(false);
    expect(result.entitlementWeeks.amount).toBeNull();
    expect(result.ordinaryHours.amount).toBeNull();
    expect(result.ordinaryRate.amount).toBeNull();
    expect(result.loadingRate.amount).toBeNull();
    expect(result.balanceHours.amount).toBeNull();
  }
});

it("requires explicit non-casual leave eligibility for ambiguous employee arrangements", () => {
  for (const employment of ["fixed-term", "apprentice", "labour-hire", "other-employee"]) {
    const unknown = annualLeave(leaveOffer({ employment }), ordinaryAnnualCash);
    expect(unknown.eligible).toBe(false);
    expect(unknown.ordinaryRate.reason).toContain("Confirm non-casual");
    expect(
      annualLeave(leaveOffer({ employment, leaveEligible: "yes" }), ordinaryAnnualCash).eligible,
    ).toBe(true);
    expect(
      annualLeave(leaveOffer({ employment, ordinaryLeave: "yes" }), ordinaryAnnualCash).eligible,
    ).toBe(true);
    expect(
      annualLeave(
        leaveOffer({ employment, leaveEligible: "no", ordinaryLeave: "yes" }),
        ordinaryAnnualCash,
      ).eligible,
    ).toBe(false);
  }
  for (const employment of ["full-time", "part-time", "fixed-term"]) {
    for (const leaveEligible of ["", "no"]) {
      expect(
        annualLeave(
          leaveOffer({ employment, leaveEligible, ordinaryLeave: "yes" }),
          ordinaryAnnualCash,
        ).eligible,
      ).toBe(false);
    }
  }
});

it("keeps unsafe numeric results unavailable without changing valid independent inputs", () => {
  const overflow = annualLeave(
    leaveOffer({
      leaveRateBasis: "entered",
      leaveHourlyRate: "1e308",
      leaveLoadingBasis: "hourly",
      leaveLoadingHourly: "1e308",
      leaveBalanceHours: "1",
      leaveBalanceDate: "2026-10-25",
    }),
    ordinaryAnnualCash,
  );
  expect(overflow.ordinaryRate.amount).toBe(extremeCashRate);
  expect(overflow.entitlementBase.amount).toBeNull();
  expect(overflow.balanceGross.amount).toBeNull();
  expect(overflow.balanceHours.amount).toBe(1);
});
