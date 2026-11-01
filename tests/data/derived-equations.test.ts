import { expect, it } from "bun:test";
import {
  type ComparisonResult,
  calculateComparison,
} from "../../src/lib/calculations/comparison.ts";
import {
  comparisonInsights,
  extraHourLabel,
  extraPackageHourLabel,
} from "../../src/lib/calculations/comparison-insights.ts";
import { comparisonEquation } from "../../src/lib/explanations/comparison.ts";
import { insightEquation } from "../../src/lib/explanations/comparison-insights.ts";
import {
  differenceEquation,
  percentageDifferenceEquation,
} from "../../src/lib/explanations/difference.ts";
import {
  equationGraph,
  resolveVariable,
  unresolvedVariables,
} from "../../src/lib/explanations/navigation.ts";
import { displayValue } from "../../src/lib/explanations/presentation.ts";
import { display } from "../../src/lib/format.ts";
import { differenceLabel } from "../../src/lib/result-presentation.ts";
import { bonus, offer, profile } from "../calculations/package-fixture.ts";

function input() {
  const record = offer();
  record.items = { earnings: [bonus({ certainty: "target" })] };
  return {
    offer: record,
    profile,
    vehicle: {},
    year: "2026-27",
    target: false,
    oneOff: true,
    timeValue: true,
  } as const;
}
function explain(result: ComparisonResult, label: string) {
  return comparisonEquation(label, { ...input(), offer: result.offer, ...result.scenario }, result);
}
it("links target and guaranteed equations to their own complete scenarios", () => {
  const guaranteed = calculateComparison(input());
  const target = calculateComparison({ ...input(), target: true });
  const context = { result: target, baseline: guaranteed, guaranteed, target };
  for (const metric of comparisonInsights(target, guaranteed, guaranteed, target)) {
    const equation = insightEquation(metric.label, context, explain);
    const graph = equationGraph(equation);
    expect(unresolvedVariables(graph)).toEqual([]);
    expect(equation.result?.value).toBe(metric.amount);
    expect(equation.context).toBe("Including one-offs");
  }
  const packageEquation = insightEquation(extraPackageHourLabel, context, explain);
  expect(packageEquation.formula).toContain("offer_net_package_after_costs");
  expect(packageEquation.formula).not.toContain("offer_cash_after_costs");
  const graph = equationGraph(insightEquation("Target upside: cash after tax", context, explain));
  const amounts = { guaranteed: 77_480, target: 84_280 };
  expect(resolveVariable(graph, "", "target_value")?.value).toBeCloseTo(amounts.target);
  expect(resolveVariable(graph, "", "guaranteed_value")?.value).toBeCloseTo(amounts.guaranteed);
  expect(() => insightEquation("Unknown insight", context, explain)).toThrow(
    "Unknown comparison insight",
  );
});
it("explains absent baselines without inventing a zero value", () => {
  const result = calculateComparison({ ...input(), oneOff: false });
  const equation = insightEquation(
    extraHourLabel,
    { result, baseline: undefined, guaranteed: undefined, target: undefined },
    explain,
  );
  expect(equation.result?.value).toBeNull();
  expect(equation.context).toBe("Recurring amounts only");
  expect(
    resolveVariable(equationGraph(equation), "", "baseline_cash_after_costs")?.value,
  ).toBeNull();
  expect(unresolvedVariables(equationGraph(equation))).toEqual([]);
});
it("formats relative percentages separately from percentage-point differences", () => {
  const sample = { next: 120, base: 100, percent: 20 };
  const equation = percentageDifferenceEquation("Change", sample.next, sample.base, []);
  expect(equation.result?.value).toBe(sample.percent);
  expect(equation.result?.unit).toBe("percent");
  expect(unresolvedVariables(equationGraph(equation))).toEqual([]);
  expect(percentageDifferenceEquation("Change", sample.next, 0, []).result?.value).toBe(
    "Undefined",
  );
  expect(display(sample.percent, "percent")).toBe("20%");
  expect(displayValue(sample.percent, "percent")).toBe("20%");
  const metric = {
    label: "Remote share",
    amount: 0,
    unit: "percent",
    lowerIsBetter: null,
  } as const;
  expect(differenceLabel(sample.percent, metric)).toBe("20 percentage points more");
  expect(differenceLabel(-sample.percent, metric)).toBe("20 percentage points less");
  const percentagePoints = differenceEquation("Share change", sample.next, sample.base, [equation]);
  expect(percentagePoints.result?.unit).toBe("percentage points");
  expect(displayValue(sample.percent, percentagePoints.result?.unit)).toBe("20 percentage points");
});

it.each([
  { offer: 2582.1, baseline: 0, expected: "Undefined" },
  { offer: 0, baseline: 0, expected: "Undefined" },
  { offer: null, baseline: 0, expected: "Unavailable" },
  { offer: 2582.1, baseline: null, expected: "Unavailable" },
  { offer: 0, baseline: -100, expected: "Unavailable" },
  { offer: 120, baseline: 100, expected: "20%" },
])(
  "distinguishes undefined percentages from missing values: %j",
  ({ offer: next, baseline, expected }) => {
    const equation = percentageDifferenceEquation("Change", next, baseline, []);
    expect(displayValue(equation.result?.value ?? null, "percent")).toBe(expected);
  },
);
