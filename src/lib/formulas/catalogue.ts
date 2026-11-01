import { comparisonLabel } from "../comparison-presentation.ts";
import type { SalRecord } from "../data/model.d.ts";
import { comparisonMetrics } from "../explanations/comparison-reference.ts";

const formulaMetrics = [...comparisonMetrics]
  .map(([id, metric]) => ({ id, metric, label: comparisonLabel(metric), keywords: id }))
  .toSorted((left, right) => left.label.localeCompare(right.label, "en-AU"));

const startsWithNumber = /^\d/u;
function formulaVariable(name: string): string {
  const variable = name
    .normalize("NFKD")
    .replaceAll(/\p{M}/gu, "")
    .replaceAll(/(?<lower>[a-z0-9])(?<upper>[A-Z])/gu, "$<lower>_$<upper>")
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/gu, "_")
    .replaceAll(/^_+|_+$/gu, "");
  if (startsWithNumber.test(variable)) {
    return `formula_${variable}`;
  }
  return variable;
}

function formulaOptions(formulas: readonly SalRecord[] = []) {
  return [
    ...formulaMetrics,
    ...formulas
      .filter((entry) => entry.kind === "formula" && entry.name.trim())
      .map((entry) => ({
        id: `formula:${entry.id}`,
        metric: `formula:${entry.id}`,
        label: entry.name,
        keywords: formulaVariable(entry.name),
      })),
  ];
}

function formulaReference(text: string, formulas: readonly SalRecord[] = []) {
  const name = text.trim().toLocaleLowerCase("en-AU");
  const found = formulaOptions(formulas).find(
    (entry) =>
      entry.id === text ||
      entry.keywords === name ||
      entry.label.toLocaleLowerCase("en-AU") === name,
  );
  if (!found) {
    throw new Error(`Unknown metric: ${text}. Use Insert metric to choose a comparison value.`);
  }
  return found;
}

function readableFormula(expression: string, formulas: readonly SalRecord[] = []): string {
  return expression.replaceAll(
    /\[(?<name>[^\]]+)\]/gu,
    (_, name: string) => formulaReference(name, formulas).keywords,
  );
}

export { formulaMetrics, formulaOptions, formulaReference, formulaVariable, readableFormula };
