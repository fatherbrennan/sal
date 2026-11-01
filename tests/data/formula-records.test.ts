import { expect, it } from "bun:test";
import {
  mergeImport,
  newRecord,
  readBackup,
  readRecord,
  schemaVersion,
  validateReferences,
} from "../../src/lib/data/schema.ts";
import { formulaVariable, readableFormula } from "../../src/lib/formulas/catalogue.ts";
import { parseFormula } from "../../src/lib/formulas/parser.ts";
import { formulaMetric, selectedFormulas } from "../../src/lib/formulas/results.ts";

const now = "2026-10-29T00:00:00.000Z";
const quarterOfTwoHundred = 50;
const chainedValue = 5;
const chosenBranch = 7;
const formula = {
  ...newRecord("formula", "formula-a", now),
  name: "My value",
  fields: { expression: "1 / 4", format: "percent", direction: "lower" },
};
const comparison = {
  ...newRecord("comparison", "compare-a", now),
  items: { formulas: [{ id: "row-a", fields: { formulaId: formula.id } }] },
};

it("round-trips formulas and ordered comparison selections in validated backups", () => {
  const records = [formula, comparison];
  expect(
    readBackup({ schemaVersion, exportedAt: now, ruleVersion: "test", records }).records,
  ).toEqual(records);
  expect(selectedFormulas(comparison, records)).toEqual([formula]);
  expect(selectedFormulas(newRecord("comparison", "other", now), records)).toEqual([]);
  expect(readRecord(newRecord("formula", "draft", now)).fields).toMatchObject({ expression: "" });
  expect(
    readRecord({ ...formula, fields: { ...formula.fields, expression: "[Cash after tax] / 2" } })
      .fields,
  ).toMatchObject({ expression: "[annual_cash_after_tax] / 2" });
});

it("rejects invalid expression imports, missing references and duplicate selections", () => {
  expect(() =>
    readRecord({ ...formula, fields: { ...formula.fields, expression: "fetch(1)" } }),
  ).toThrow();
  expect(() => validateReferences([comparison])).toThrow("missing formulas");
  expect(() =>
    validateReferences([
      formula,
      {
        ...comparison,
        items: {
          formulas: [
            ...comparison.items.formulas,
            { id: "row-b", fields: { formulaId: formula.id } },
          ],
        },
      },
    ]),
  ).toThrow("duplicate");
  expect(() => readRecord({ ...formula, id: "profile" })).toThrow("identity");
  expect(() =>
    readRecord({ ...formula, fields: { ...formula.fields, format: "script" } }),
  ).toThrow();
});

it("preserves local formula versions until backup conflicts are explicitly resolved", () => {
  const incoming = { ...formula, name: "Updated value" };
  expect(() => mergeImport([formula, comparison], [incoming], {})).toThrow("conflict");
  expect(mergeImport([formula, comparison], [incoming], { "formula-a": "local" })).toEqual([
    formula,
    comparison,
  ]);
  expect(mergeImport([formula, comparison], [incoming], { "formula-a": "import" })[0]?.name).toBe(
    "Updated value",
  );
  expect(formula.name).toBe("My value");
});

it("formats ratios as percentages and keeps preference direction explicit", () => {
  expect(formulaMetric(formula, [])).toEqual({
    label: "My value",
    amount: 25,
    unit: "percent",
    lowerIsBetter: true,
    reason: "",
  });
  expect(
    formulaMetric(
      { ...formula, fields: { ...formula.fields, format: "money", direction: "higher" } },
      [],
    ),
  ).toMatchObject({ amount: 0.25, unit: "money", lowerIsBetter: false });
  expect(formulaMetric(newRecord("formula", "draft", now), [])).toMatchObject({
    amount: null,
    unit: "number",
    lowerIsBetter: null,
  });
  expect(
    formulaMetric({ ...formula, fields: { ...formula.fields, format: "" } }, []),
  ).toMatchObject({ amount: null, reason: "Choose a result format." });
  expect(
    formulaMetric({ ...formula, fields: { ...formula.fields, expression: "1e308" } }, []),
  ).toMatchObject({ amount: null, reason: "The percentage is too large to display." });
});

it("keeps archived formulas available to existing comparisons", () => {
  const archived = { ...formula, archived: true };
  validateReferences([archived, comparison]);
  expect(selectedFormulas(comparison, [archived])).toEqual([archived]);
});

it("keeps custom references stable through renames, archives and backup round trips", () => {
  const source = { ...formula, name: "My value" };
  const expression = parseFormula("my_value * 200", [source]).source;
  expect(expression).toBe("[formula:formula-a] * 200");
  const dependent = {
    ...source,
    id: "dependent",
    name: "Dependent",
    fields: {
      expression,
      format: "money",
      direction: "higher",
    },
  };
  const renamed = { ...source, name: "Renamed Value", archived: true };
  const records = [dependent, renamed];
  validateReferences(records);
  expect(readableFormula(expression, records)).toBe("renamed_value * 200");
  expect(parseFormula("renamed_value * 200", records).source).toBe(expression);
  expect(formulaMetric(dependent, [], records).amount).toBe(quarterOfTwoHundred);
  const backup = readBackup({ schemaVersion, exportedAt: now, ruleVersion: "test", records });
  expect(formulaMetric(dependent, [], backup.records).amount).toBe(quarterOfTwoHundred);
});

it("evaluates dependency chains independently of selection order and preserves unavailable values", () => {
  const second = {
    ...formula,
    id: "second",
    name: "Second",
    fields: {
      expression: "[formula:formula-a] * 8",
      format: "number",
    },
  };
  const third = {
    ...second,
    id: "third",
    name: "Third",
    fields: {
      expression: "[formula:second] + 3",
      format: "number",
    },
  };
  const records = [third, second, formula];
  expect(formulaMetric(third, [], records).amount).toBe(chainedValue);
  const unavailable = { ...formula, fields: { ...formula.fields, expression: "1 / 0" } };
  expect(formulaMetric(third, [], [third, second, unavailable]).amount).toBeNull();
  expect(
    formulaMetric(
      { ...third, fields: { ...third.fields, expression: "IF(1 = 1, 7, [formula:formula-a])" } },
      [],
      [unavailable],
    ).amount,
  ).toBe(chosenBranch);
});

it("rejects missing dependencies, cycles and conflicting or reserved variable names", () => {
  const other = {
    ...formula,
    id: "other",
    name: "Other",
    fields: { ...formula.fields, expression: "[formula:formula-a]" },
  };
  expect(() => validateReferences([other])).toThrow("Missing");
  expect(() =>
    validateReferences([
      other,
      { ...formula, fields: { ...formula.fields, expression: "[formula:other]" } },
    ]),
  ).toThrow("Circular");
  expect(() =>
    validateReferences([
      { ...formula, fields: { ...formula.fields, expression: "[formula:formula-a]" } },
    ]),
  ).toThrow("Circular");
  for (const name of ["my_value", "Annual cash after tax", "IF", "!!!"]) {
    expect(() => validateReferences([formula, { ...other, name }])).toThrow(
      "different formula name",
    );
  }
  expect(() => validateReferences([other, { ...formula, name: "" }])).toThrow("unnamed");
  expect(formulaVariable("MyCustom Value!")).toBe("my_custom_value");
  expect(formulaVariable("2026 value")).toBe("formula_2026_value");
});
