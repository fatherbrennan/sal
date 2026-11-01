import { expect, it } from "bun:test";
import type { Metric } from "../../src/lib/calculations/comparison.ts";
import { formulaMetrics, readableFormula } from "../../src/lib/formulas/catalogue.ts";
import { evaluateFormula } from "../../src/lib/formulas/evaluate.ts";
import { formulaError, parseFormula } from "../../src/lib/formulas/parser.ts";

const metrics: Metric[] = [
  {
    label: "Cash after tax and personal super",
    amount: 80_000,
    unit: "money",
    lowerIsBetter: false,
  },
  { label: "Calendar work hours", amount: 2000, unit: "number", lowerIsBetter: null },
  { label: "Commute hours", amount: 0, unit: "number", lowerIsBetter: true },
  { label: "Personal perk value", amount: null, unit: "money", lowerIsBetter: false },
  { label: "Remote share of worked hours", amount: 25, unit: "percent", lowerIsBetter: null },
];

it.each([
  { source: "2 + 3 * 4", expected: 14 },
  { source: "(2 + 3) * 4", expected: 20 },
  { source: "8 / 2 / 2", expected: 2 },
  { source: "10 - 3 - 2", expected: 5 },
  { source: "-(2 + 3) + +4", expected: -1 },
  { source: ".5 + 1. + 2e2", expected: 201.5 },
  { source: "100 * 12.5%", expected: 12.5 },
  { source: "[Cash after tax] / [Work hours per year]", expected: 40 },
  { source: "annual_cash_after_tax / annual_work_hours", expected: 40 },
  { source: "round(ANNUAL_CASH_AFTER_TAX / annual_work_hours, 2)", expected: 40 },
  { source: "IF(annual_commute_hours = 0, 42, 1 / annual_commute_hours)", expected: 42 },
  { source: "[remote_work_percent] * 200", expected: 50 },
  { source: "MIN(8, -1, 3)", expected: -1 },
  { source: "MAX(8, -1, 3)", expected: 8 },
  { source: "ABS(-4)", expected: 4 },
  { source: "ROUND(1.005, 2)", expected: 1.01 },
  { source: "ROUND(-1.005, 2)", expected: -1.01 },
  { source: "ROUND(1250, -2)", expected: 1300 },
  { source: "ROUND(-1250, -2)", expected: -1300 },
  { source: "ROUND(0, 0)", expected: 0 },
  { source: "ROUND(1e308, 12)", expected: 1e308 },
  { source: "ROUND(1.7976931348623157e308, 0)", expected: Number.MAX_VALUE },
  { source: "ROUND(0.0000000000005, 12)", expected: 1e-12 },
  { source: "IF(1 = 1, 7, 9)", expected: 7 },
  { source: "IF(1 != 1, 7, 9)", expected: 9 },
  { source: "IF(1 <> 2, 7, 9)", expected: 7 },
  { source: "IF(1 < 2, 7, 9)", expected: 7 },
  { source: "IF(2 <= 2, 7, 9)", expected: 7 },
  { source: "IF(3 > 2, 7, 9)", expected: 7 },
  { source: "IF(2 >= 3, 7, 9)", expected: 9 },
  { source: "IF([Commute hours per year] = 0, 42, 1 / [Commute hours per year])", expected: 42 },
  { source: "IF(1 = 2, [Personal perk value], MAX(4, 5))", expected: 5 },
])("evaluates $source independently", ({ source, expected }) => {
  expect(evaluateFormula(source, metrics)).toEqual({ amount: expected, reason: "" });
});

const excessiveNesting = 66;
const excessiveTerms = 257;
const excessiveLength = 8001;
it.each([
  ["", "Enter a formula"],
  ["[Personal perk value] * 0", "unavailable"],
  ["IF([Personal perk value] > 0, 1, 2)", "unavailable"],
  ["[annual_net_package_value]", "unavailable"],
  ["annual_net_package_value", "unavailable"],
  ["1 / 0", "divide by zero"],
  ["1e308 * 10", "too large"],
  ["IF(1, 2, 3)", "comparison"],
  ["1 < 2", "need numbers"],
  ["ABS(1 < 2)", "need numbers"],
  ["ROUND(10, 0.5)", "whole number"],
  ["ROUND(10, 13)", "whole number"],
  ["MIN()", "arguments"],
  ["IF(1=1, 2)", "arguments"],
] as const)("keeps %s unavailable with a reason", (source, reason) => {
  const result = evaluateFormula(source, metrics);
  expect(result.amount).toBeNull();
  expect(result.reason).toContain(reason);
});

it.each([
  "process.exit()",
  "fetch('https://example.com')",
  "[other_offer.cash]",
  "[My formula]",
  "1;2",
  "Math.max(1,2)",
  "SUM(1,2)",
  "unknown_metric + 1",
  "(1+2",
  "1 2",
  "1 +",
  "MIN(1,)",
  "ABS(1,2)",
  "MIN 1",
  "1e999",
  "1 ** 2",
  "[]",
  "[Cash after tax",
  "1 && 2",
  `${"(".repeat(excessiveNesting)}1${")".repeat(excessiveNesting)}`,
  `${"1+".repeat(excessiveTerms)}1`,
  "1".repeat(excessiveLength),
])("rejects unsupported or malformed expressions", (source) => {
  expect(formulaError(source)).not.toBeNull();
});

it("shows snake_case variables while preserving stored references and label aliases", () => {
  const parsed = parseFormula(" [cash after tax] / [standard_paid_hours_per_year] ");
  expect(parsed.source).toBe("[annual_cash_after_tax] / [standard_paid_hours_per_year]");
  expect(parsed.references).toEqual(["annual_cash_after_tax", "standard_paid_hours_per_year"]);
  expect(readableFormula(parsed.source)).toBe(
    "annual_cash_after_tax / standard_paid_hours_per_year",
  );
  expect(readableFormula("[Cash after tax] / 2")).toBe("annual_cash_after_tax / 2");
  expect(parseFormula(readableFormula(parsed.source)).source).toBe(parsed.source);
  expect(formulaError(" ")).toBeNull();
  expect(formulaError("2 + 2")).toBeNull();
  expect(new Set(formulaMetrics.map((metric) => metric.id)).size).toBe(formulaMetrics.length);
});
