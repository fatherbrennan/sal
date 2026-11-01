import { expect, it } from "bun:test";
import {
  type ComparisonInput,
  calculateComparison,
} from "../../src/lib/calculations/comparison.ts";
import type { Fields } from "../../src/lib/data/model.d.ts";
import { readRecord } from "../../src/lib/data/schema.ts";
import { bonus, offer, profile } from "./package-fixture.ts";

const netAnnual = "Package value after tax and job costs";
const netHourly = "Package value after tax and costs per work + travel hour";
const grossAnnual = "Package value before tax, after job costs";
const grossHourly = "Package value before tax, after costs per work + travel hour";
const precision = 6;

function source(fields: Fields = {}, hours = "8"): ComparisonInput {
  const record = offer({ energy: "none", ...fields });
  record.items = {
    roster: [
      {
        id: "wednesday",
        fields: {
          day: "1",
          start: "09:00",
          hours,
          journeys: "1",
          place: "onsite",
          breakMinutes: "30",
          breakStart: "12:30",
        },
      },
    ],
  };
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
function amounts(input: ComparisonInput) {
  return Object.fromEntries(
    calculateComparison(input).metrics.map(({ label, amount }) => [label, amount]),
  );
}

it("reconciles package value after costs and uses worked plus commute hours once", () => {
  const input = source();
  Object.assign(input.offer.items, {
    perks: [{ id: "perk", fields: { amount: "200", frequency: "annual" } }],
    costs: [
      {
        id: "cost",
        fields: {
          amount: "1000",
          reimbursement: "200",
          frequency: "annual",
          recurrence: "recurring",
        },
      },
    ],
  });
  const result = amounts(input);
  const expected = {
    net: 87_080,
    gross: 111_400,
    worked: 424,
    travel: 53,
    netHourly: 182.557_651_99,
    grossHourly: 233.542_976_94,
  };
  expect(result[netAnnual]).toBeCloseTo(expected.net, precision);
  expect(result[grossAnnual]).toBeCloseTo(expected.gross, precision);
  expect(result[netHourly]).toBeCloseTo(expected.netHourly, precision);
  expect(result[grossHourly]).toBeCloseTo(expected.grossHourly, precision);
  expect(result["Calendar work hours"]).toBeCloseTo(expected.worked, precision);
  expect(result["Commute hours"]).toBeCloseTo(expected.travel, precision);
  const disabled = amounts({ ...input, timeValue: false });
  for (const label of [netAnnual, netHourly, grossAnnual, grossHourly]) {
    expect(disabled[label]).toBe(result[label]);
  }
});

it("keeps annual value independent of paid-hour conversion and rewards fewer worked hours", () => {
  const short = amounts(source({ weeklyHours: "30" }));
  const long = amounts(source({ weeklyHours: "40" }, "10"));
  const expected = { annual: 87_680, shortHourly: 183.815_513_63, longHourly: 150.394_511_15 };
  expect(short[netAnnual]).toBeCloseTo(expected.annual, precision);
  expect(long[netAnnual]).toBeCloseTo(expected.annual, precision);
  expect(short[netHourly]).toBeCloseTo(expected.shortHourly, precision);
  expect(long[netHourly]).toBeCloseTo(expected.longHourly, precision);
  expect(amounts(source({ weeklyHours: "" }))[netHourly]).toBe(short[netHourly]);
  expect(amounts(source({ personalSuper: "1000" }))[netHourly]).toBe(short[netHourly]);
});

it.each([
  { year: "2025-26", expected: 87_412 },
  { year: "2026-27", expected: 87_680 },
] as const)("retains the selected year's assessment estimate: %j", ({ year, expected }) => {
  expect(amounts({ ...source(), year })[netAnnual]).toBeCloseTo(expected, precision);
});

it("keeps base, guaranteed, target and one-off scenarios distinct", () => {
  const input = source();
  Object.assign(input.offer.items, {
    earnings: [bonus({ certainty: "target" })],
    costs: [{ id: "setup", fields: { amount: "100", reimbursement: "0", recurrence: "once" } }],
  });
  const expected = { base: 87_680, target: 95_500, baseOnce: 87_580, targetOnce: 95_400 };
  expect(amounts({ ...input, baseOnly: true })[netAnnual]).toBeCloseTo(expected.base, precision);
  expect(amounts(input)[netAnnual]).toBeCloseTo(expected.base, precision);
  expect(amounts({ ...input, target: true })[netAnnual]).toBeCloseTo(expected.target, precision);
  expect(amounts({ ...input, oneOff: true })[netAnnual]).toBeCloseTo(expected.baseOnce, precision);
  expect(amounts({ ...input, oneOff: true, target: true })[netAnnual]).toBeCloseTo(
    expected.targetOnce,
    precision,
  );
});

it("preserves independent gross values, unknown costs and zero-hour boundaries", () => {
  const unknownFund = amounts(source({ ordinaryFund: "" }));
  const gross = 112_000;
  expect(unknownFund[netAnnual]).toBeNull();
  expect(unknownFund[netHourly]).toBeNull();
  expect(unknownFund[grossAnnual]).toBe(gross);
  const missingMinutes = amounts(source({ minutes: "" }));
  const net = 87_680;
  expect(missingMinutes[netAnnual]).toBeCloseTo(net, precision);
  expect(missingMinutes[netHourly]).toBeNull();
  const unknownCost = amounts(source({ tripCharges: "" }));
  expect(unknownCost[netAnnual]).toBeNull();
  expect(unknownCost[grossHourly]).toBeNull();
  const noWork = source();
  noWork.offer.items = {};
  expect(amounts(noWork)[netAnnual]).toBeCloseTo(net, precision);
  expect(amounts(noWork)[netHourly]).toBeNull();
  const zero = amounts(source({ amount: "0" }));
  expect(zero[netAnnual]).toBe(0);
  expect(zero[netHourly]).toBe(0);
});

it("does not deduct sole-trader business cash costs a second time", () => {
  const input = source({
    employment: "sole-trader",
    amount: "110000",
    gst: "inclusive",
    businessCosts: "10000",
    businessDeductions: "10000",
    eligibleLabour: "0",
    specifiedDeductions: "0",
  });
  const expected = { net: 70_680, hourly: 148.176_100_63 };
  expect(amounts(input)[netAnnual]).toBeCloseTo(expected.net, precision);
  expect(amounts(input)[netHourly]).toBeCloseTo(expected.hourly, precision);
  const gross = 90_000;
  expect(amounts(input)[grossAnnual]).toBeCloseTo(gross, precision);
  expect(
    amounts({ ...input, timeValue: false })["Package value before tax, after job costs and time"],
  ).toBeCloseTo(gross, precision);
  input.offer.fields = { ...input.offer.fields, businessDeductions: "0" };
  expect(amounts(input)[grossAnnual]).toBeCloseTo(gross, precision);
  input.offer.fields = { ...input.offer.fields, businessCosts: "" };
  expect(amounts(input)[grossAnnual]).toBeNull();
  expect(amounts(source({ businessCosts: "9999" }))[grossAnnual]).toBe(
    amounts(source())[grossAnnual],
  );
});

it("retains negative package value without turning missing costs into zero", () => {
  const input = source();
  Object.assign(input.offer.items, {
    costs: [
      {
        id: "cost",
        fields: {
          amount: "100000",
          reimbursement: "0",
          recurrence: "recurring",
          frequency: "annual",
        },
      },
    ],
  });
  const expected = { net: -12_320, hourly: -25.828_092_24 };
  expect(amounts(input)[netAnnual]).toBeCloseTo(expected.net, precision);
  expect(amounts(input)[netHourly]).toBeCloseTo(expected.hourly, precision);
});

it("keeps leave balances out of package value and only entered absence changes worked hours", () => {
  const input = source();
  const before = amounts(input);
  input.offer.fields = {
    ...input.offer.fields,
    annualLeave: "6",
    leaveBalanceHours: "200",
    leaveBalanceDate: "2026-07-01",
  };
  expect(amounts(input)[netAnnual]).toBe(before[netAnnual]);
  expect(amounts(input)[netHourly]).toBe(before[netHourly]);
  Object.assign(input.offer.items, {
    exceptions: [
      {
        id: "leave",
        fields: { date: "2026-07-01", hours: "0", journeys: "0", place: "remote", kind: "leave" },
      },
    ],
  });
  const expected = { worked: 416, travel: 52, hourly: 187.350_427_35 };
  expect(amounts(input)[netAnnual]).toBe(before[netAnnual]);
  expect(amounts(input)["Calendar work hours"]).toBe(expected.worked);
  expect(amounts(input)["Commute hours"]).toBe(expected.travel);
  expect(amounts(input)[netHourly]).toBeCloseTo(expected.hourly, precision);
});

it("keeps unrepresentable hourly values unavailable for a valid extremely small work duration", () => {
  const input = source();
  const zeroPlaces = 323;
  input.offer.items = {
    roster: [],
    exceptions: [
      {
        id: "tiny-work",
        fields: {
          date: "2026-07-01",
          hours: `0.${"0".repeat(zeroPlaces)}5`,
          journeys: "0",
          place: "remote",
          kind: "work",
        },
      },
    ],
  };
  input.offer = readRecord(input.offer);
  const result = amounts(input);
  const expectedAnnual = 87_680;
  expect(result[netAnnual]).toBeCloseTo(expectedAnnual, precision);
  expect(result["Calendar work hours"]).toBe(Number.MIN_VALUE);
  expect(result[netHourly]).toBeNull();
  expect(result[grossHourly]).toBeNull();
});
