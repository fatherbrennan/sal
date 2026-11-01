import { expect, it } from "bun:test";
import {
  difference,
  inherited,
  product,
  quotient,
  total,
} from "../../src/lib/calculations/inputs.ts";
import {
  annualAmount,
  baseHourly,
  cashBeforeTax,
  ordinarySuperNet,
  remuneration,
} from "../../src/lib/calculations/remuneration.ts";
import { bonus, offer } from "./package-fixture.ts";

const expected = {
  paidHours: 2080,
  cashWithBonus: 110_000,
  superWithBonus: 13_200,
  packageWithBonus: 123_200,
  packageHourly: 59.230_769,
  cashAfterSacrifice: 105_000,
  netSuper: 11_220,
  basePackage: 112_000,
  baseCash: 100_000,
  dayAnnual: 80_000,
  contractorCash: 90_000,
  baseHourly: 53.846_153_846,
  cappedGross: 350_000,
  cappedCash: 317_500.4,
  cappedSuper: 32_499.6,
  cappedExclusiveGross: 382_499.6,
  cappedBonusCash: 328_700.4,
  cappedBonusGross: 361_200,
  priorCappedCash: 320_000,
  priorCappedSuper: 30_000,
};

it("splits an inclusive salary and annual bonus without changing the quoted package", () => {
  const record = offer();
  record.items = { earnings: [bonus()] };
  const result = remuneration(record, "2026-27", false, false);
  expect(result.cash).toBeCloseTo(expected.cashWithBonus);
  expect(result.super).toBeCloseTo(expected.superWithBonus);
  expect(result.gross).toBeCloseTo(expected.packageWithBonus);
  expect(result.paidHours).toBe(expected.paidHours);
  expect(baseHourly(result)).toBeCloseTo(expected.packageHourly);
  expect(cashBeforeTax(result, { sacrifice: "5000" })).toBeCloseTo(expected.cashAfterSacrifice);
  expect(ordinarySuperNet(result.super, { ordinaryFund: "yes" })).toBeCloseTo(expected.netSuper);
  expect(ordinarySuperNet(result.super, {})).toBeNull();
});
it("keeps target earnings and one-offs out of guaranteed recurring remuneration", () => {
  const record = offer();
  record.items = { earnings: [bonus({ certainty: "target", recurrence: "once" })] };
  expect(remuneration(record, "2026-27", false, false).gross).toBeCloseTo(expected.basePackage);
  expect(remuneration(record, "2026-27", true, false).gross).toBeCloseTo(expected.basePackage);
  expect(remuneration(record, "2026-27", true, true).gross).toBeCloseTo(expected.packageWithBonus);
  record.items = { earnings: [bonus({ included: "yes" })] };
  expect(remuneration(record, "2026-27", true, true).gross).toBeCloseTo(expected.basePackage);
  record.items = { earnings: [bonus({ certainty: "" })] };
  expect(remuneration(record, "2026-27", true, true).cash).toBeNull();
});
it("uses explicitly entered paid units and preserves incomplete quotes", () => {
  expect(annualAmount({ amount: "50", unit: "hour", paidUnits: "2000" })).toBe(expected.baseCash);
  expect(annualAmount({ amount: "400", unit: "day", paidUnits: "200" })).toBe(expected.dayAnnual);
  expect(annualAmount({ amount: "400" })).toBeNull();
  expect(remuneration(offer({ employment: "" }), "2026-27", false, false).cash).toBeNull();
  for (const change of [
    { amount: "" },
    { superRate: "" },
    { superEligible: "" },
    { inclusion: "" },
  ]) {
    expect(remuneration(offer(change), "2026-27", false, false).cash).toBeNull();
  }
  const exempt = remuneration(
    offer({ superEligible: "no", inclusion: "excludes" }),
    "2026-27",
    false,
    false,
  );
  expect(exempt.cash).toBe(expected.basePackage);
  expect(exempt.super).toBe(0);
});
it("does not silently turn quarterly contribution limits into annual limits", () => {
  expect(remuneration(offer({ evenSuper: "" }), "2025-26", false, false).cash).toBeNull();
  expect(remuneration(offer(), "2025-26", false, false).cash).toBeCloseTo(expected.baseCash);
  expect(
    remuneration(offer({ amount: "500000", superLimit: "uncapped" }), "2026-27", false, false).cash,
  ).not.toBeNull();
});

it("retains an inclusive quote and hourly value while its cash/super split is unknown", () => {
  for (const fields of [{ superEligible: "" }, { superRate: "" }, { superLimit: "" }]) {
    const result = remuneration(offer(fields), "2026-27", false, false);
    expect(result.gross).toBe(expected.basePackage);
    expect(baseHourly(result)).toBeCloseTo(expected.baseHourly);
    expect(result.cash).toBeNull();
    expect(result.super).toBeNull();
    expect(result.baseCash).toBeNull();
  }
});
it("reconciles the verified annual SG cap without leaking an uncapped payroll base", () => {
  const result = remuneration(offer({ amount: "350000" }), "2026-27", false, false);
  expect(result.gross).toBe(expected.cappedGross);
  expect(result.cash).toBeCloseTo(expected.cappedCash);
  expect(result.super).toBeCloseTo(expected.cappedSuper);
  expect(result.baseCash).toBeCloseTo(expected.cappedCash);
  const prior = remuneration(offer({ amount: "350000", evenSuper: "" }), "2025-26", false, false);
  expect(prior.gross).toBe(expected.cappedGross);
  expect(prior.cash).toBeNull();
  expect(prior.baseCash).toBeNull();
});
it("rejects an eligible statutory rate below the selected years' minimum", () => {
  for (const superRate of ["0", "11.99"]) {
    const result = remuneration(offer({ superRate }), "2026-27", false, false);
    expect(result.gross).toBe(expected.basePackage);
    expect(result.cash).toBeNull();
    expect(result.super).toBeNull();
    expect(result.baseCash).toBeNull();
  }
});
it("keeps exclusive cash known and applies only established cap/allocation premises", () => {
  const exclusive = remuneration(
    offer({ amount: "350000", inclusion: "excludes" }),
    "2026-27",
    false,
    false,
  );
  expect(exclusive.cash).toBe(expected.cappedGross);
  expect(exclusive.gross).toBeCloseTo(expected.cappedExclusiveGross);
  expect(exclusive.super).toBeCloseTo(expected.cappedSuper);
  expect(exclusive.baseCash).toBe(expected.cappedGross);
  const unknownCap = remuneration(
    offer({ inclusion: "excludes", superLimit: "" }),
    "2026-27",
    false,
    false,
  );
  expect(unknownCap.cash).toBe(expected.basePackage);
  expect(unknownCap.baseCash).toBe(expected.basePackage);
  expect(unknownCap.super).toBeNull();
  const prior = remuneration(offer({ amount: "350000" }), "2025-26", false, false);
  expect(prior.cash).toBeCloseTo(expected.priorCappedCash);
  expect(prior.super).toBeCloseTo(expected.priorCappedSuper);
});
it("does not invent the allocation of capped super between inclusive base and bonus quotes", () => {
  const record = offer({ amount: "350000" });
  record.items = { earnings: [bonus()] };
  const result = remuneration(record, "2026-27", false, false);
  expect(result.cash).toBeCloseTo(expected.cappedBonusCash);
  expect(result.gross).toBe(expected.cappedBonusGross);
  expect(result.super).toBeCloseTo(expected.cappedSuper);
  expect(result.baseCash).toBeNull();
  record.items = { earnings: [bonus({ inclusion: "excludes" })] };
  const mixed = remuneration(record, "2026-27", false, false);
  expect(mixed.cash).toBeNull();
  expect(mixed.super).toBeNull();
  expect(mixed.baseCash).toBeNull();
  const contractual = remuneration(
    offer({ amount: "350000", superRate: "15" }),
    "2026-27",
    false,
    false,
  );
  expect(contractual.gross).toBe(expected.cappedGross);
  expect(contractual.cash).toBeNull();
});
it.each([
  { cash: "270829", superAmount: 32_499.48 },
  { cash: "270830", superAmount: 32_499.6 },
  { cash: "270831", superAmount: 32_499.6 },
])("uses the independently checked annual SG boundary: $cash", ({ cash, superAmount }) => {
  const result = remuneration(
    offer({ amount: cash, inclusion: "excludes" }),
    "2026-27",
    false,
    false,
  );
  expect(result.super).toBeCloseTo(superAmount);
  expect(result.cash).toBe(Number(cash));
});
it("does not silently ignore employee earnings rows on a contractor offer", () => {
  const record = offer({ employment: "sole-trader", gst: "none", contractorSuper: "0" });
  record.items = { earnings: [bonus()] };
  const result = remuneration(record, "2026-27", false, false);
  expect(result.gross).toBeNull();
  expect(result.cash).toBeNull();
  expect(result.paidHours).toBe(expected.paidHours);
  expect(result.notes).toContain(
    "Include all fee items in annual revenue; employee bonus rows do not apply to sole-trader fees.",
  );
});
it("separates contractor GST, fees, expenses and additional hirer super", () => {
  const record = offer({
    employment: "sole-trader",
    amount: "110000",
    gst: "inclusive",
    contractorSuper: "0",
    businessCosts: "10000",
  });
  const result = remuneration(record, "2026-27", false, false);
  expect(result.cash).toBeCloseTo(expected.baseCash);
  expect(cashBeforeTax(result, record.fields)).toBeCloseTo(expected.contractorCash);
  expect(
    remuneration(offer({ employment: "sole-trader", gst: "" }), "2026-27", false, false).cash,
  ).toBeNull();
  expect(
    remuneration(
      offer({ employment: "sole-trader", gst: "exclusive", contractorSuper: "0" }),
      "2026-27",
      false,
      false,
    ).cash,
  ).toBe(expected.basePackage);
});
it("propagates unknowns without replacing them with zero", () => {
  const sum = 3;
  expect(total([1, null])).toBeNull();
  expect(total([1, 2])).toBe(sum);
  expect(difference(null, 1)).toBeNull();
  expect(difference(1, null)).toBeNull();
  expect(difference(sum, 1)).toBe(2);
  expect(product(null, 1)).toBeNull();
  expect(quotient(1, 0)).toBeNull();
  expect(quotient(null, 1)).toBeNull();
  expect(quotient(1, null)).toBeNull();
  expect(inherited({ price: "0" }, { price: "2" }, "price")).toBe(0);
  expect(inherited({}, { price: "2" }, "price")).toBe(2);
});
it("requires a known super cap and rejects salary sacrifice beyond cash", () => {
  expect(remuneration(offer({ superLimit: "" }), "2026-27", false, false).cash).toBeNull();
  const quote = remuneration(offer(), "2026-27", false, false);
  expect(cashBeforeTax(quote, { sacrifice: "100001" })).toBeNull();
  const record = offer();
  record.items = { earnings: [bonus({ included: "yes", certainty: "target" })] };
  expect(remuneration(record, "2026-27", false, false).cash).toBeNull();
  expect(remuneration(record, "2026-27", true, false).gross).toBeCloseTo(expected.basePackage);
});
