import { expect, it } from "bun:test";
import {
  type ComparisonInput,
  calculateComparison,
} from "../../src/lib/calculations/comparison.ts";
import type { Fields } from "../../src/lib/data/model.d.ts";
import { comparisonEquation } from "../../src/lib/explanations/comparison.ts";
import { equationInspection } from "../../src/lib/inspector/equations.ts";
import { nodeAt } from "../../src/lib/inspector/model.ts";
import { bonus, offer, profile } from "../calculations/package-fixture.ts";

function input(fields: Fields = {}, earnings: Fields = {}): ComparisonInput {
  const record = offer(fields);
  record.items = { earnings: [bonus(earnings)] };
  return {
    offer: record,
    profile,
    vehicle: {},
    year: "2026-27",
    target: false,
    oneOff: false,
    timeValue: false,
  };
}

function inspect(source: ComparisonInput, label = "Base employer super") {
  const result = calculateComparison(source);
  return equationInspection([comparisonEquation(label, source, result)], label);
}

it.each([
  { fields: { amount: "112000" }, expected: 12_000 },
  { fields: { amount: "105000" }, expected: 11_250 },
  { fields: { amount: "100000", inclusion: "excludes" }, expected: 12_000 },
  { fields: { amount: "56", unit: "hour", paidUnits: "2000" }, expected: 12_000 },
  { fields: { amount: "560", unit: "day", paidUnits: "200" }, expected: 12_000 },
  { fields: { amount: "115000", superRate: "15", superLimit: "uncapped" }, expected: 15_000 },
])("base-super inspector follows only the salary component: %j", ({ fields, expected }) => {
  const model = inspect(input(fields));
  const root = nodeAt(model, model.root);
  expect(root.amount).toBeCloseTo(expected);
  expect(root.formula?.map(({ text }) => text)).toEqual([
    "annual_base_employer_super = annual_base_super_before_cap",
  ]);
  expect(root.terms.map(({ id }) => nodeAt(model, id).symbol)).toEqual([
    "annual_base_super_before_cap",
  ]);
  expect([...model.nodes.values()].some(({ symbol }) => symbol.includes("bonus"))).toBe(false);
  expect([...model.nodes.values()].some(({ symbol }) => symbol === "annual_employer_super")).toBe(
    false,
  );
});

it("bonus-super inspector subtracts isolated base super from the selected total", () => {
  const model = inspect(input(), "Selected bonus / commission super");
  const root = nodeAt(model, model.root);
  const expectedBonus = 1200;
  const expectedTotal = 13_200;
  const expectedBase = 12_000;
  expect(root.amount).toBeCloseTo(expectedBonus);
  expect(root.formula?.map(({ text }) => text)).toEqual([
    "annual_bonus_employer_super = annual_employer_super - annual_base_employer_super",
  ]);
  const parts = root.terms.map(({ id }) => nodeAt(model, id));
  expect(parts.map(({ symbol }) => symbol)).toEqual([
    "annual_employer_super",
    "annual_base_employer_super",
  ]);
  expect(parts[0]?.amount).toBeCloseTo(expectedTotal);
  expect(parts[1]?.amount).toBeCloseTo(expectedBase);
  expect(parts[1]?.formula?.map(({ text }) => text)).toEqual([
    "annual_base_employer_super = annual_base_super_before_cap",
  ]);
});

it("earned leave traces its employer super to base pay without bonus super", () => {
  const source = input({
    annualLeave: "4",
    leaveOrdinaryHours: "40",
    leaveRateBasis: "salary",
    leaveLoadingBasis: "none",
  });
  const model = inspect(source, "Annual leave: allocated base employer super");
  const expected = 923.076_923_076_923_1;
  expect(nodeAt(model, model.root).amount).toBeCloseTo(expected);
  const base = [...model.nodes.values()].find(
    ({ symbol }) => symbol === "base_super__annual_base_employer_super",
  );
  expect(base?.formula?.map(({ text }) => text)).toEqual([
    "annual_base_employer_super = annual_base_super_before_cap",
  ]);
  expect([...model.nodes.values()].some(({ symbol }) => symbol.includes("bonus"))).toBe(false);
});

it.each([
  { year: "2025-26", expected: 30_000 },
  { year: "2026-27", expected: 32_499.6 },
] as const)("capped base super uses its earnings limit in $year", ({ year, expected }) => {
  const source = { ...input({ amount: "400000" }, { eligible: "no" }), year };
  const model = inspect(source);
  const root = nodeAt(model, model.root);
  expect(root.amount).toBeCloseTo(expected);
  expect(root.formula?.map(({ text }) => text)).toEqual([
    "annual_base_employer_super = employer_super_earnings_limit * 12 / 100",
  ]);
  expect(root.terms.map(({ id }) => nodeAt(model, id).symbol)).toEqual([
    "employer_super_earnings_limit",
  ]);
  const cash = inspect(source, "Annual base cash before deductions");
  expect(nodeAt(cash, cash.root).formula?.map(({ text }) => text)).toEqual([
    "annual_base_cash = annual_base_pay_quote - annual_base_employer_super",
  ]);
});

it("a bonus reaching the cap does not give a zero or ineligible base the bonus's super", () => {
  for (const fields of [{ amount: "0" }, { amount: "100000", superEligible: "no" }]) {
    const model = inspect(input(fields, { amount: "400000" }));
    expect(nodeAt(model, model.root).amount).toBe(0);
    expect(nodeAt(model, model.root).formula?.map(({ text }) => text)).toEqual([
      "annual_base_employer_super = annual_base_super_before_cap",
    ]);
  }
});

it("base-only super excludes bonuses while unsupported allocations stay unavailable", () => {
  const source = input();
  const model = inspect({ ...source, baseOnly: true });
  const expected = 12_000;
  expect(nodeAt(model, model.root).amount).toBeCloseTo(expected);
  expect([...model.nodes.values()].some(({ symbol }) => symbol.includes("bonus"))).toBe(false);
  for (const unavailable of [
    input({ amount: "400000" }),
    input({ inclusion: "" }),
    input({}, { included: "yes" }),
  ]) {
    const missing = inspect(unavailable);
    const root = nodeAt(missing, missing.root);
    expect(root.amount).toBeNull();
    expect(root.formula?.map(({ text }) => text)).toEqual([
      "annual_base_employer_super = unavailable",
    ]);
    expect(root.terms).toEqual([]);
  }
});
