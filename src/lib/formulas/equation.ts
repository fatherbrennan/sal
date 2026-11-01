import type { ComparisonResult } from "../calculations/comparison.ts";
import { value } from "../calculations/inputs.ts";
import type { SalRecord } from "../data/model.d.ts";
import type { Equation, EquationReference, EquationSection } from "../explanations/model.ts";
import { formulaReference, formulaVariable } from "./catalogue.ts";
import { parseFormula } from "./parser.ts";
import { formulaMetric } from "./results.ts";

const maximumDependencies = 64;

function checkDependencies(id: string, visited: readonly string[]): void {
  if (visited.includes(id) || visited.length >= maximumDependencies) {
    throw new Error("Circular or excessively deep formula reference.");
  }
}

function displayExpression(
  source: string,
  units: Record<string, string>,
  formulas: readonly SalRecord[],
): string {
  return source.replaceAll(/\[(?<id>[^\]]+)\]/gu, (_, id: string) => {
    const variable = formulaReference(id, formulas).keywords;
    if (units[variable] === "percent") {
      return `(${variable} / 100)`;
    }
    return variable;
  });
}

function formulaEquation(
  formula: SalRecord,
  result: ComparisonResult,
  explain: (result: ComparisonResult, label: string) => Equation,
  context: { formulas?: readonly SalRecord[]; visited?: readonly string[] } = {},
): Equation {
  const { formulas = [], visited = [] } = context;
  checkDependencies(formula.id, visited);
  const metric = formulaMetric(formula, result.metrics, formulas);
  const name = formulaVariable(formula.name || "Untitled formula");
  const source = value(formula.fields, "expression");
  let parsed: ReturnType<typeof parseFormula> | null = null;
  if (source.trim()) {
    parsed = parseFormula(source, formulas);
  }
  const values: Record<string, number | null> = {};
  const units: Record<string, string> = {};
  const references: Record<string, EquationReference> = {};
  const sections: EquationSection[] = [];
  function operand(id: string) {
    const dependency = formulas.find((entry) => `formula:${entry.id}` === id);
    if (dependency) {
      return {
        input: formulaMetric(dependency, result.metrics, formulas),
        equation: formulaEquation(dependency, result, explain, {
          formulas,
          visited: [...visited, formula.id],
        }),
      };
    }
    const reference = formulaReference(id, formulas);
    return {
      input: result.metrics.find((entry) => entry.label === reference.metric),
      equation: explain(result, reference.metric),
    };
  }
  for (const id of parsed?.references ?? []) {
    const reference = formulaReference(id, formulas);
    const { input, equation } = operand(id);
    const variable = reference.keywords;
    values[variable] = input?.amount ?? null;
    units[variable] = input?.unit ?? "number";
    if (equation.result) {
      references[variable] = { scope: variable, name: equation.result.name };
    }
    sections.push({ ...equation, scope: variable });
  }
  let expression = displayExpression(parsed?.source ?? "unavailable", units, formulas);
  if (metric.unit === "percent") {
    expression = `(${expression}) * 100`;
  }
  return {
    title: `${formula.name || "Untitled formula"} · ${result.offer.name || "Untitled offer"}`,
    formula: `${name} = ${expression}`,
    values,
    units,
    references,
    sections,
    result: { name, value: metric.amount, unit: metric.unit },
    notes: [
      "User-defined formula. Uses this offer's selected year and earnings scenario.",
      "Percentage inputs are fractions: 25% is 0.25. Percentage results display 0.25 as 25%.",
      "IF evaluates only its selected branch. Missing required inputs remain unavailable. Display format does not verify compatible units.",
      ...[metric.reason].filter(Boolean),
    ],
  };
}

export { formulaEquation };
