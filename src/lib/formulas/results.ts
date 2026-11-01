import type { Metric } from "../calculations/comparison.ts";
import { rows, value } from "../calculations/inputs.ts";
import type { SalRecord } from "../data/model.d.ts";
import { evaluateFormula, type FormulaResult } from "./evaluate.ts";
import { parseFormula } from "./parser.ts";

function formulaMetric(
  formula: SalRecord,
  metrics: readonly Metric[],
  formulas: readonly SalRecord[] = [],
): Metric & FormulaResult {
  const cache = new Map<string, Metric & FormulaResult>();
  const visiting = new Set<string>();
  const maximumDependencies = 64;
  function calculate(current: SalRecord): Metric & FormulaResult {
    const cached = cache.get(current.id);
    if (cached) {
      return cached;
    }
    const unavailable = (reason: string): Metric & FormulaResult => ({
      label: current.name,
      amount: null,
      unit: "number",
      lowerIsBetter: null,
      reason,
    });
    if (visiting.has(current.id) || visiting.size >= maximumDependencies) {
      return unavailable("Circular formula reference or dependency chain exceeds 64 formulas.");
    }
    visiting.add(current.id);
    try {
      const source = value(current.fields, "expression");
      let references: string[] = [];
      if (source.trim()) {
        ({ references } = parseFormula(source, formulas));
      }
      const dependencies = references
        .filter((id) => id.startsWith("formula:"))
        .map((id) => {
          const dependency = formulas.find((entry) => `formula:${entry.id}` === id);
          let result = unavailable(`Missing formula: ${id}`);
          if (dependency) {
            result = calculate(dependency);
          }
          return { ...result, label: id };
        });
      const result = formatFormula(
        current,
        evaluateFormula(
          source,
          [...metrics.filter((metric) => !metric.label.startsWith("formula:")), ...dependencies],
          formulas,
        ),
      );
      cache.set(current.id, result);
      return result;
    } catch (error) {
      let reason = "Invalid formula.";
      if (error instanceof Error) {
        reason = error.message;
      }
      return unavailable(reason);
    } finally {
      visiting.delete(current.id);
    }
  }
  return calculate(formula);
}

function formatFormula(formula: SalRecord, result: FormulaResult): Metric & FormulaResult {
  const { format, direction } = formula.fields;
  let unit: Metric["unit"] = "number";
  if (format === "money" || format === "percent") {
    unit = format;
  }
  if (!format) {
    return {
      ...result,
      label: formula.name || "Untitled formula",
      unit,
      lowerIsBetter: null,
      amount: null,
      reason: "Choose a result format.",
    };
  }
  let lowerIsBetter: boolean | null = null;
  if (direction === "higher" || direction === "lower") {
    lowerIsBetter = direction === "lower";
  }
  let { amount } = result;
  if (amount !== null && unit === "percent") {
    const percentScale = 100;
    amount *= percentScale;
  }
  if (amount !== null && !Number.isFinite(amount)) {
    return {
      label: formula.name,
      unit,
      lowerIsBetter,
      amount: null,
      reason: "The percentage is too large to display.",
    };
  }
  return { ...result, amount, label: formula.name || "Untitled formula", unit, lowerIsBetter };
}

function selectedFormulas(comparison: SalRecord, records: readonly SalRecord[]): SalRecord[] {
  return rows(comparison, "formulas").flatMap((item) =>
    records.filter(
      (record) => record.kind === "formula" && record.id === value(item.fields, "formulaId"),
    ),
  );
}

export { formulaMetric, selectedFormulas };
