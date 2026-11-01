import { expect, it } from "bun:test";
import { calculateComparison } from "../../src/lib/calculations/comparison.ts";
import { newRecord } from "../../src/lib/data/schema.ts";
import { comparisonEquation } from "../../src/lib/explanations/comparison.ts";
import { equationGraph, unresolvedVariables } from "../../src/lib/explanations/navigation.ts";
import { formulaMetrics } from "../../src/lib/formulas/catalogue.ts";
import { formulaEquation } from "../../src/lib/formulas/equation.ts";
import { equationInspection } from "../../src/lib/inspector/equations.ts";
import { offer, profile } from "../calculations/package-fixture.ts";

const input = {
  offer: offer(),
  profile,
  vehicle: {},
  year: "2026-27",
  target: false,
  oneOff: false,
  timeValue: false,
} as const;
const result = calculateComparison(input);
const thousandsOfBaseCash = 100;
const constantResult = 42;
const quarterOfTwoHundred = 50;
const draft = newRecord("formula", "formula-a", "2026-10-29T00:00:00.000Z");
const explain = (current: typeof result, label: string) =>
  comparisonEquation(label, input, current);

it("exposes every per-offer comparison metric once with a stable reference", () => {
  expect(new Set(formulaMetrics.map((entry) => entry.metric))).toEqual(
    new Set(result.metrics.map((entry) => entry.label)),
  );
});

it("links custom formula operands to the complete source equations", () => {
  const formula = {
    ...draft,
    name: "Salary in thousands",
    fields: { expression: "[Base cash pay before tax] / 1000", format: "money" },
  };
  const equation = formulaEquation(
    formula,
    {
      ...result,
      metrics: [
        ...result.metrics,
        { label: "formula:formula-a", amount: 100, unit: "money", lowerIsBetter: false },
      ],
    },
    explain,
  );
  expect(equation.result).toMatchObject({ name: "salary_in_thousands", unit: "money" });
  expect(equation.formula).toBe("salary_in_thousands = annual_base_cash / 1000");
  expect(equation.result?.value).toBeCloseTo(thousandsOfBaseCash);
  expect(unresolvedVariables(equationGraph(equation))).toEqual([]);
  const model = equationInspection([equation], formula.name);
  expect(model.nodes.get(model.root)?.amount).toBeCloseTo(thousandsOfBaseCash);
  expect(model.nodes.get(model.root)?.terms.length).toBeGreaterThan(0);
});

it("explains fractions, constants, unavailable inputs and blank drafts", () => {
  const formula = {
    ...draft,
    fields: { expression: "[Remote share of work hours (%)] + 25%", format: "percent" },
  };
  const equation = formulaEquation(formula, result, explain);
  expect(equation.formula).toContain("(remote_work_percent / 100)");
  expect(equation.formula).toContain("* 100");
  expect(formulaEquation(draft, result, explain).result?.value).toBeNull();
  expect(
    formulaEquation({ ...draft, fields: { expression: "42", format: "number" } }, result, explain)
      .result?.value,
  ).toBe(constantResult);
  expect(
    formulaEquation(formula, { ...result, metrics: [] }, () => ({
      title: "Missing",
      formula: "unavailable",
      values: {},
      notes: [],
    })).result?.value,
  ).toBeNull();
});

it("explains custom dependencies using their current variable names", () => {
  const parent = {
    ...draft,
    name: "Renamed ratio",
    fields: { expression: "1 / 4", format: "percent" },
  };
  const child = {
    ...draft,
    id: "child",
    name: "Child",
    fields: {
      expression: "[formula:formula-a] * 200",
      format: "money",
    },
  };
  const equation = formulaEquation(child, result, explain, { formulas: [child, parent] });
  expect(equation.result?.value).toBe(quarterOfTwoHundred);
  expect(equation.result?.name).toBe("child");
  const { renamed_ratio: reference } = equation.references ?? {};
  expect(reference).toEqual({
    scope: "renamed_ratio",
    name: "renamed_ratio",
  });
  expect(equation.formula).toContain("(renamed_ratio / 100)");
  expect(unresolvedVariables(equationGraph(equation))).toEqual([]);
});
