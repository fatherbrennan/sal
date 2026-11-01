import type { ComparisonResult } from "../calculations/comparison.ts";
import { leaveMetricKeys, leaveValuationKeys } from "../calculations/leave-metrics.ts";
import { leaveDefinitions } from "./annual-leave.ts";
import { leaveValuationDefinitions } from "./leave-valuation.ts";
import { metricEquations } from "./metric-definitions.ts";
import type { Equation } from "./model.ts";

function comparisonKey(result: ComparisonResult): string {
  return JSON.stringify([result.offer.id, result.tax.withOffer.input.year, result.scenario]);
}

function referenceEquation(equation: Equation, result: ComparisonResult, metric: string): Equation {
  return { ...equation, comparison: { key: comparisonKey(result), metric } };
}

const comparisonMetrics = new Map([
  ...Object.entries(metricEquations).map(([label, [name]]) => [name, label] as const),
  ...Object.entries(leaveMetricKeys).map(
    ([label, key]) => [leaveDefinitions[key].name, label] as const,
  ),
  ...Object.entries(leaveValuationKeys).map(
    ([label, key]) => [leaveValuationDefinitions[key][0], label] as const,
  ),
]);

const comparisonVariables = new Map([...comparisonMetrics].map(([name, label]) => [label, name]));

export { comparisonKey, comparisonMetrics, comparisonVariables, referenceEquation };
