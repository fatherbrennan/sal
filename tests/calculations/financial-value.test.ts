import { expect, it } from "bun:test";
import { calculateComparison } from "../../src/lib/calculations/comparison.ts";
import { jobCostReimbursements } from "../../src/lib/calculations/costs.ts";
import type { Fields } from "../../src/lib/data/model.d.ts";
import { offer, profile } from "./package-fixture.ts";

const precision = 6;
const expectedTime = 2234.153_846_153_846;

function input(fields: Fields = {}) {
  const record = offer({ energy: "none", ...fields });
  record.items = {
    roster: [
      {
        id: "shift",
        fields: { day: "1", start: "09:00", hours: "8", journeys: "1", place: "onsite" },
      },
    ],
    perks: [{ id: "perk", fields: { amount: "", frequency: "annual" } }],
    costs: [
      {
        id: "expense",
        fields: {
          amount: "1000",
          reimbursement: "200",
          frequency: "annual",
          recurrence: "recurring",
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
  } as const;
}
function metrics(source = input()) {
  return Object.fromEntries(
    calculateComparison(source).metrics.map(({ label, amount }) => [label, amount]),
  );
}

it("values commute time from cash plus super independently of perks and personal transfers", () => {
  for (const personalSuper of ["0", "1000", "100000"]) {
    const result = metrics(input({ personalSuper }));
    expect(result["Commute-time value at cash + super after tax"]).toBeCloseTo(
      expectedTime,
      precision,
    );
  }
  const unknownSuper = metrics(input({ ordinaryFund: "" }));
  expect(unknownSuper["Commute-time value at cash + super after tax"]).toBeNull();
});

it("separates commuting-only package totals from other job costs", () => {
  const source = input({ maintenance: "0.1", tripCharges: "5", energy: "fuel" });
  source.offer.items = {
    ...source.offer.items,
    perks: [{ id: "perk", fields: { amount: "200", frequency: "annual" } }],
  };
  const result = metrics({
    ...source,
    vehicle: { energy: "fuel", consumption: "8", energyPrice: "2" },
  });
  // 53 return trips: $339.20 fuel + $212 maintenance + $265 trip charges.
  const expected = {
    cashPerks: 77_680,
    commuteOnly: 87_063.8,
    commuteAndTime: 84_829.646_153_846,
    allCosts: 86_263.8,
  };
  expect(result["Cash after tax + personal perks"]).toBeCloseTo(expected.cashPerks, precision);
  expect(result["Package value after tax and commuting costs"]).toBeCloseTo(
    expected.commuteOnly,
    precision,
  );
  expect(result["Package value after tax, commuting costs and time"]).toBeCloseTo(
    expected.commuteAndTime,
    precision,
  );
  expect(result["Package value after tax and job costs"]).toBeCloseTo(expected.allCosts, precision);
});

it("keeps financial reward independent of an unknown personal perk valuation", () => {
  const result = metrics();
  const expected = {
    cash: 76_680,
    financial: 86_880,
    hourly: 182.138_364_78,
    beforeCosts: 87_680,
    paidHourly: 42.153_846_15,
    costs: 800,
  };
  expect(result["Cash after tax and job costs"]).toBeCloseTo(expected.cash);
  expect(result["Cash + super after tax and job costs"]).toBeCloseTo(expected.financial);
  expect(result["Cash + super after tax and costs per work + travel hour"]).toBeCloseTo(
    expected.hourly,
  );
  expect(result["Cash + super after tax"]).toBeCloseTo(expected.beforeCosts);
  expect(result["Cash + super after tax per paid hour"]).toBeCloseTo(expected.paidHourly);
  expect(result["Package value after tax and job costs"]).toBeNull();
  expect(result["Contractor operating surplus before personal tax"]).toBeNull();
  expect(result["Total unreimbursed job costs / broader estimate"]).toBe(expected.costs);
  expect(
    metrics(input({ personalSuper: "1000" }))["Cash + super after tax and job costs"],
  ).toBeCloseTo(expected.financial);
  expect(metrics(input({ ordinaryFund: "" }))["Cash + super after tax and job costs"]).toBeNull();
});

it("keeps cash and commuting subtotals independent of unrelated unknown components", () => {
  const source = input();
  source.offer.items = {
    ...source.offer.items,
    perks: [{ id: "perk", fields: { amount: "200", frequency: "annual" } }],
    costs: [
      {
        id: "unknown",
        fields: { amount: "", reimbursement: "0", recurrence: "recurring", frequency: "annual" },
      },
    ],
  };
  const result = metrics(source);
  const packageBeforeCosts = 87_880;
  expect(result["Package value after tax and commuting costs"]).toBeCloseTo(packageBeforeCosts);
  expect(result["Package value after tax and job costs"]).toBeNull();
  source.offer.fields = { ...source.offer.fields, ordinaryFund: "" };
  const unknownSuper = metrics(source);
  const cashAndPerks = 77_680;
  expect(unknownSuper["Cash after tax + personal perks"]).toBeCloseTo(cashAndPerks);
  expect(unknownSuper["Package value after tax"]).toBeNull();
});

it("shows all contractor costs without deducting business spending twice", () => {
  const result = metrics(
    input({
      employment: "sole-trader",
      amount: "110000",
      gst: "inclusive",
      businessCosts: "10000",
      businessDeductions: "10000",
      eligibleLabour: "0",
      specifiedDeductions: "0",
    }),
  );
  const expected = { costs: 10_800, retained: 69_880, surplus: 90_000 };
  expect(result["Total unreimbursed job costs / broader estimate"]).toBe(expected.costs);
  expect(result["Cash + super after tax and job costs"]).toBeCloseTo(expected.retained);
  expect(result["Contractor operating surplus before personal tax"]).toBeCloseTo(expected.surplus);
});

it("keeps transferred cash in the financial time rate and rejects negative combined value", () => {
  const result = metrics(input({ personalSuper: "100000" }));
  const cash = -22_520;
  expect(result["Cash after tax and personal super"]).toBeCloseTo(cash);
  expect(result["Commute-time value at cash + super after tax"]).toBeCloseTo(
    expectedTime,
    precision,
  );
  expect(result["Package value after tax, job costs and time"]).toBeNull();
  const retained = 86_880;
  expect(result["Cash + super after tax and job costs"]).toBeCloseTo(retained);
  const source = input();
  const negative = calculateComparison({
    ...source,
    profile: { ...profile, taxableWithOffer: "400000", taxableWithoutOffer: "0" },
  });
  expect(
    negative.metrics.find(({ label }) => label === "Commute-time value at cash + super after tax")
      ?.amount,
  ).toBeNull();
  expect(negative.notes.some((note) => note.includes("per paid hour is negative"))).toBe(true);
});

it("zero commute time or disabled valuation needs no unknown or negative hourly rate", () => {
  for (const fields of [
    { minutes: "0", personalSuper: "100000" },
    { minutes: "0", amount: "" },
  ]) {
    expect(metrics(input(fields))["Commute-time value at cash + super after tax"]).toBe(0);
    expect(metrics(input(fields))["Commute-time value at package before tax"]).toBe(0);
  }
  const source = input({ minutes: "", amount: "" });
  expect(metrics(source)["Commute-time value at cash + super after tax"]).toBeNull();
  const disabled = calculateComparison({ ...source, timeValue: false });
  expect(
    disabled.metrics.find(({ label }) => label === "Commute-time value at cash + super after tax")
      ?.amount,
  ).toBe(0);
});

it.each([
  {
    amount: "",
    reimbursement: "100",
    frequency: "annual",
    recurrence: "recurring",
    oneOff: false,
    expected: 100,
  },
  {
    amount: "100",
    reimbursement: "20",
    frequency: "monthly",
    recurrence: "recurring",
    oneOff: false,
    expected: 240,
  },
  {
    amount: "100",
    reimbursement: "20",
    frequency: "",
    recurrence: "recurring",
    oneOff: false,
    expected: null,
  },
  {
    amount: "100",
    reimbursement: "",
    frequency: "annual",
    recurrence: "recurring",
    oneOff: false,
    expected: null,
  },
  {
    amount: "100",
    reimbursement: "20",
    frequency: "",
    recurrence: "once",
    oneOff: false,
    expected: 0,
  },
  {
    amount: "100",
    reimbursement: "20",
    frequency: "",
    recurrence: "once",
    oneOff: true,
    expected: 20,
  },
  {
    amount: "100",
    reimbursement: "101",
    frequency: "annual",
    recurrence: "recurring",
    oneOff: true,
    expected: null,
  },
  {
    amount: "100",
    reimbursement: "20",
    frequency: "annual",
    recurrence: "",
    oneOff: false,
    expected: null,
  },
])(
  "retains known reimbursements without inventing expense amounts: %j",
  ({ oneOff, expected, ...fields }) => {
    const record = offer();
    record.items = { costs: [{ id: "cost", fields }] };
    expect(jobCostReimbursements(record, null, oneOff)).toBe(expected);
  },
);
