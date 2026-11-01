import type { Metric } from "../calculations/comparison.ts";
import type { SalRecord } from "../data/model.d.ts";
import { formulaReference } from "./catalogue.ts";
import { type Expression, parseFormula } from "./parser.ts";

interface FormulaResult {
  amount: number | null;
  reason: string;
}
const maximumPlaces = 12;
const decimalBase = 10n;
const percentScale = 100;

function finite(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error("The result is too large to calculate.");
  }
  return value;
}

function numeric(value: number | boolean): number {
  if (typeof value !== "number") {
    throw new Error("Use a comparison inside IF; arithmetic and results need numbers.");
  }
  return finite(value);
}

function rounded(value: number, places: number): number {
  if (!Number.isInteger(places) || Math.abs(places) > maximumPlaces) {
    throw new Error("ROUND decimal places must be a whole number from -12 to 12.");
  }
  const [mantissa = "0", exponent = "0"] = String(Math.abs(value)).split("e");
  const scale = (mantissa.split(".")[1]?.length ?? 0) - Number(exponent) - places;
  const numerator = BigInt(mantissa.replace(".", "")) * decimalBase ** BigInt(Math.max(0, -scale));
  const denominator = decimalBase ** BigInt(Math.max(0, scale));
  const whole = (numerator * 2n + denominator) / (denominator * 2n);
  return finite(Math.sign(value) * Number(`${whole}e${-places}`));
}

function binary(operator: string, left: number, right: number): number | boolean {
  switch (operator) {
    case "+":
      return finite(left + right);
    case "-":
      return finite(left - right);
    case "*":
      return finite(left * right);
    case "/":
      if (right === 0) {
        throw new Error("Cannot divide by zero.");
      }
      return finite(left / right);
    case "=":
      return left === right;
    case "!=":
    case "<>":
      return left !== right;
    case "<":
      return left < right;
    case "<=":
      return left <= right;
    case ">":
      return left > right;
    default:
      return left >= right;
  }
}

function metricValue(id: string, metrics: readonly Metric[]): number {
  let reference = { metric: id, label: id };
  if (!id.startsWith("formula:")) {
    reference = formulaReference(id);
  }
  const metric = metrics.find((entry) => entry.label === reference.metric);
  if (metric?.amount === null || metric === undefined || !Number.isFinite(metric.amount)) {
    throw new Error(`${reference.label} is unavailable for this offer and scenario.`);
  }
  if (metric.unit === "percent") {
    return metric.amount / percentScale;
  }
  return metric.amount;
}

function call(
  node: Extract<Expression, { kind: "call" }>,
  metrics: readonly Metric[],
): number | boolean {
  const values = node.arguments.map((entry) => numeric(evaluate(entry, metrics)));
  switch (node.name) {
    case "MIN":
      return Math.min(...values);
    case "MAX":
      return Math.max(...values);
    case "ABS":
      return Math.abs(values[0] ?? 0);
    default:
      return rounded(values[0] ?? 0, values[1] ?? 0);
  }
}

function evaluate(node: Expression, metrics: readonly Metric[]): number | boolean {
  switch (node.kind) {
    case "conditional": {
      const condition = evaluate(node.condition, metrics);
      if (typeof condition !== "boolean") {
        throw new Error("IF needs a comparison, such as annual_commute_hours > 0.");
      }
      if (condition) {
        return evaluate(node.positive, metrics);
      }
      return evaluate(node.negative, metrics);
    }
    case "number":
      return node.value;
    case "metric":
      return metricValue(node.id, metrics);
    case "unary": {
      const value = numeric(evaluate(node.operand, metrics));
      if (node.operator === "-") {
        return -value;
      }
      return value;
    }
    case "binary":
      return binary(
        node.operator,
        numeric(evaluate(node.left, metrics)),
        numeric(evaluate(node.right, metrics)),
      );
    default:
      return call(node, metrics);
  }
}

function evaluateFormula(
  source: string,
  metrics: readonly Metric[],
  formulas: readonly SalRecord[] = [],
): FormulaResult {
  if (!source.trim()) {
    return { amount: null, reason: "Enter a formula to calculate a result." };
  }
  try {
    return {
      amount: numeric(evaluate(parseFormula(source, formulas).expression, metrics)),
      reason: "",
    };
  } catch (failure) {
    let reason = "Unable to calculate.";
    if (failure instanceof Error) {
      reason = failure.message;
    }
    return { amount: null, reason };
  }
}

export type { FormulaResult };
export { evaluateFormula };
