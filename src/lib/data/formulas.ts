import { value } from "../calculations/inputs.ts";
import { formulaMetrics, formulaVariable } from "../formulas/catalogue.ts";
import { parseFormula } from "../formulas/parser.ts";
import type { SalRecord } from "./model.d.ts";

function dependencies(formula: SalRecord, formulas: readonly SalRecord[]): SalRecord[] {
  const source = value(formula.fields, "expression");
  if (!source.trim()) {
    return [];
  }
  return parseFormula(source, formulas)
    .references.filter((id) => id.startsWith("formula:"))
    .map((id) => {
      const dependency = formulas.find((entry) => `formula:${entry.id}` === id);
      if (!dependency?.name.trim()) {
        throw new Error(`Missing or unnamed formula reference in ${formula.name}.`);
      }
      return dependency;
    });
}

function validateFormulaNames(formulas: readonly SalRecord[]): void {
  const names = new Set([
    ...formulaMetrics.map((entry) => entry.id),
    "if",
    "min",
    "max",
    "abs",
    "round",
  ]);
  for (const formula of formulas.filter((entry) => entry.name.trim())) {
    const variable = formulaVariable(formula.name);
    if (!variable || names.has(variable)) {
      throw new Error(
        `Choose a different formula name: variable ${variable || "(empty)"} is unavailable.`,
      );
    }
    names.add(variable);
  }
}

function validateFormulaReferences(records: readonly SalRecord[]): void {
  const formulas = records.filter((record) => record.kind === "formula");
  validateFormulaNames(formulas);
  const complete = new Set<string>();
  const visiting = new Set<string>();
  const maximumDependencies = 64;
  function visit(formula: SalRecord): void {
    if (visiting.has(formula.id)) {
      throw new Error(`Circular formula reference: ${formula.name}.`);
    }
    if (visiting.size >= maximumDependencies) {
      throw new Error("Use at most 64 dependent formulas.");
    }
    if (complete.has(formula.id)) {
      return;
    }
    visiting.add(formula.id);
    for (const dependency of dependencies(formula, formulas)) {
      visit(dependency);
    }
    visiting.delete(formula.id);
    complete.add(formula.id);
  }
  for (const formula of formulas) {
    visit(formula);
  }
  const known = new Set(
    records.filter((record) => record.kind === "formula").map((record) => record.id),
  );
  for (const record of records.filter((entry) => entry.kind === "comparison")) {
    const { formulas: selected = [] } = record.items;
    const ids = selected.map(({ fields: { formulaId = "" } }) => formulaId);
    if (new Set(ids).size !== ids.length || ids.some((id) => !known.has(id))) {
      throw new Error("A comparison has duplicate or missing formulas.");
    }
  }
}

export { validateFormulaReferences };
