import type { ComparisonResult } from "../calculations/comparison.ts";
import {
  cashMetric,
  comparisonInsights,
  contingentShareLabel,
  extraHourLabel,
  extraPackageHourLabel,
  freedHourLabel,
  hoursMetric,
  metricAmount,
  packageMetric,
  targetCashMetric,
  targetUpsideMetrics,
} from "../calculations/comparison-insights.ts";
import type { Equation, EquationReference, EquationSection, EquationValue } from "./model.ts";

interface InsightContext {
  result: ComparisonResult;
  baseline: ComparisonResult | undefined;
  guaranteed: ComparisonResult | undefined;
  target: ComparisonResult | undefined;
}
interface InsightSource {
  name: string;
  result: ComparisonResult | undefined;
  metric: string;
}
function insightDefinition(label: string, context: InsightContext) {
  const { result, baseline, guaranteed, target } = context;
  if ([extraHourLabel, extraPackageHourLabel, freedHourLabel].includes(label)) {
    let metric = cashMetric;
    let valueName = "cash_after_costs";
    if (label === extraPackageHourLabel) {
      metric = packageMetric;
      valueName = "net_package_after_costs";
    }
    const offerName = `offer_${valueName}`;
    const baselineName = `baseline_${valueName}`;
    let formula = `comparison_insight = (${offerName} - ${baselineName}) / (offer_work_and_travel_hours - baseline_work_and_travel_hours)`;
    let condition =
      "Requires strictly more work + commute hours. Equal, fewer or unknown hours leave this ratio unavailable.";
    if (label === freedHourLabel) {
      formula = `comparison_insight = (${baselineName} - ${offerName}) / (baseline_work_and_travel_hours - offer_work_and_travel_hours)`;
      condition =
        "Requires both strictly fewer work + commute hours and lower cash. Equal, higher or unknown cash, or equal, more or unknown hours leave this ratio unavailable.";
    }
    return {
      sources: [
        { name: offerName, result, metric },
        { name: baselineName, result: baseline, metric },
        { name: "offer_work_and_travel_hours", result, metric: hoursMetric },
        { name: "baseline_work_and_travel_hours", result: baseline, metric: hoursMetric },
      ],
      formula,
      note: `${condition} Uses a selected baseline and ${metric.toLowerCase()}. Monetary commute time deductions and unpaid breaks are excluded. This compares the named money/time dimensions, not overall suitability.`,
    };
  }
  let metric = targetUpsideMetrics.find((entry) => entry.label === label)?.source;
  let formula = "comparison_insight = target_value - guaranteed_value";
  if (label === contingentShareLabel) {
    metric = targetCashMetric;
    formula = "comparison_insight = (target_value - guaranteed_value) / target_value * 100";
  }
  if (metric === undefined) {
    throw new Error(`Unknown comparison insight: ${label}`);
  }
  return {
    sources: [
      { name: "target_value", result: target, metric },
      { name: "guaranteed_value", result: guaranteed, metric },
    ],
    formula,
    note: "Contingent target upside, not guaranteed income or a probability. Both complete scenarios use the same offer, year, settings and one-off selection. Tax is recalculated for each full scenario. A share requires strictly positive known target cash.",
  };
}
function sourceEquations(
  sources: InsightSource[],
  explain: (result: ComparisonResult, label: string) => Equation,
) {
  const values: Record<string, EquationValue> = {};
  const units: Record<string, string> = {};
  const references: Record<string, EquationReference> = {};
  const origins: Record<string, string> = {};
  const sections: EquationSection[] = [];
  for (const source of sources) {
    values[source.name] = metricAmount(source.result, source.metric);
    units[source.name] = "money";
    if (source.metric === hoursMetric) {
      units[source.name] = "number";
    }
    origins[source.name] =
      `${source.metric} for ${source.name.replaceAll("_", " ")}. Missing values remain unavailable.`;
    if (source.result !== undefined) {
      const equation = explain(source.result, source.metric);
      sections.push({ ...equation, title: source.name.replaceAll("_", " "), scope: source.name });
      if (equation.result !== undefined) {
        references[source.name] = { scope: source.name, name: equation.result.name };
      }
    }
  }
  return { values, units, references, origins, sections };
}
function insightEquation(
  label: string,
  input: InsightContext,
  explain: (result: ComparisonResult, label: string) => Equation,
): Equation {
  const { result, baseline, guaranteed, target } = input;
  const definition = insightDefinition(label, input);
  const metric = comparisonInsights(result, baseline, guaranteed, target).find(
    (entry) => entry.label === label,
  );
  let context = "Recurring amounts only";
  if (result.scenario.oneOff) {
    context = "Including one-offs";
  }
  return {
    title: result.offer.name || "Untitled offer",
    formula: definition.formula,
    context,
    ...sourceEquations(definition.sources, explain),
    notes: [definition.note],
    result: {
      name: "comparison_insight",
      value: metric?.amount ?? null,
      unit: metric?.unit ?? "money",
    },
  };
}

export { insightEquation };
