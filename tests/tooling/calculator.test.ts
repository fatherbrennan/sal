import { describe, expect, it } from "bun:test";
import {
  type CalculatorNumber,
  calculate,
  formatCalculatorValue,
  isOperator,
  numericValue,
  type Operator,
  zeroCalculatorValue,
} from "../../src/lib/calculator.ts";

const excessiveInputLength = 4097;

function value(text: string): CalculatorNumber {
  const parsed = numericValue(text);
  if (parsed === null) {
    throw new Error(`Invalid calculator fixture: ${text}`);
  }
  return parsed;
}

function result(before: CalculatorNumber, operator: Operator, operand: string): CalculatorNumber {
  const entry = calculate(before, operator, value(operand));
  if (typeof entry === "string") {
    throw new Error(entry);
  }
  return entry.result;
}

describe("quick calculator", () => {
  it("uses displayed currency, signs, percentages and precise unit prices", () => {
    for (const entry of [
      { text: "$1,234.56", numerator: 30_864n, denominator: 25n },
      { text: "−$42.50", numerator: -85n, denominator: 2n },
      { text: "$-2.50", numerator: -5n, denominator: 2n },
      { text: "12%", numerator: 12n, denominator: 1n },
      { text: "1.98765", numerator: 39_753n, denominator: 20_000n },
      { text: ".5", numerator: 1n, denominator: 2n },
      { text: "-0", numerator: 0n, denominator: 1n },
      { text: "1e3", numerator: 1000n, denominator: 1n },
      { text: "2.50e-3", numerator: 1n, denominator: 400n },
      { text: "9007199254740993", numerator: 9_007_199_254_740_993n, denominator: 1n },
    ] as const) {
      expect(numericValue(entry.text)).toEqual({
        numerator: entry.numerator,
        denominator: entry.denominator,
      });
    }
    for (const text of [
      "",
      "Unavailable",
      "1,23",
      "12 dollars",
      "2026-27",
      "1.2.3",
      ".5.5",
      "Infinity",
      "NaN",
      "1e999",
      "1e-999999999",
      "0".repeat(excessiveInputLength),
    ]) {
      expect(numericValue(text)).toBeNull();
    }
  });
});

describe("calculator operations", () => {
  it("applies sequential operations and retains the exact previous total for undo", () => {
    for (const entry of [
      { before: "0", operator: "+", operand: "20", result: "20" },
      { before: "20", operator: "-", operand: "5", result: "15" },
      { before: "15", operator: "*", operand: "-2", result: "-30" },
      { before: "-30", operator: "/", operand: "4", result: "-7.5" },
      { before: "15", operator: "*", operand: "0", result: "0" },
      { before: "0", operator: "-", operand: "5", result: "-5" },
      { before: "1", operator: "/", operand: "-2", result: "-0.5" },
    ] as const) {
      const before = value(entry.before);
      const operand = value(entry.operand);
      const calculation = calculate(before, entry.operator, operand);
      expect(calculation).toEqual({
        before,
        operator: entry.operator,
        operand,
        result: value(entry.result),
      });
      if (typeof calculation === "string") {
        throw new Error(calculation);
      }
      expect(calculation.before).toBe(before);
    }
  });
  it("rejects division by zero, overflow and invalid fractions", () => {
    expect(calculate(value("1"), "/", zeroCalculatorValue)).toBe(
      "Cannot divide by zero. Total unchanged.",
    );
    expect(calculate(value(String(Number.MAX_VALUE)), "*", value("2"))).toBe(
      "Result is too large. Total unchanged.",
    );
    expect(calculate({ numerator: 1n, denominator: 0n }, "+", value("2"))).toBe(
      "Enter a finite number.",
    );
    expect(calculate(value("2"), "+", { numerator: 1n, denominator: -1n })).toBe(
      "Enter a finite number.",
    );
  });
  it("only recognises the four operator keys", () => {
    for (const key of ["+", "-", "*", "/"]) {
      expect(isOperator(key)).toBe(true);
    }
    expect(isOperator("=")).toBe(false);
  });
});

describe("exact calculator arithmetic and display", () => {
  it("keeps decimal addition exact before the next operation", () => {
    const sum = result(value("0.1"), "+", "0.2");
    expect(sum).toEqual(value("0.3"));
    expect(result(sum, "-", "0.3")).toEqual(zeroCalculatorValue);
    expect(result(value("9007199254740993"), "-", "9007199254740992")).toEqual(value("1"));
  });
  it("retains recurring fractions through later operations and undo", () => {
    for (const divisor of ["3", "49"]) {
      const fraction = result(value("1"), "/", divisor);
      expect(result(fraction, "*", divisor)).toEqual(value("1"));
      const next = calculate(fraction, "+", value("1"));
      if (typeof next === "string") {
        throw new Error(next);
      }
      expect(result(next.before, "*", divisor)).toEqual(value("1"));
    }
  });
  it("rounds only display to 15 significant digits, with ties away from zero", () => {
    for (const entry of [
      { input: "0", text: "0", rounded: false },
      { input: "1234.56", text: "1,234.56", rounded: false },
      { input: "-0.5", text: "-0.5", rounded: false },
      { input: "1.111111111111115", text: "1.11111111111112", rounded: true },
      { input: "-1.111111111111115", text: "-1.11111111111112", rounded: true },
      { input: "9.999999999999995", text: "10", rounded: true },
      { input: "1000000000000000", text: "1,000,000,000,000,000", rounded: false },
      { input: "1000000000000001", text: "1,000,000,000,000,000", rounded: true },
      { input: "1e-20", text: "0.00000000000000000001", rounded: false },
    ]) {
      expect(formatCalculatorValue(value(entry.input))).toEqual({
        text: entry.text,
        rounded: entry.rounded,
      });
    }
    const third = result(value("1"), "/", "3");
    expect(formatCalculatorValue(third)).toEqual({ text: "0.333333333333333", rounded: true });
    expect(result(third, "*", "3")).toEqual(value("1"));
  });
  it("bounds precision growth without underflowing small decimals to zero", () => {
    const small = value("1e-3000");
    expect(result(small, "/", "1e-3000")).toEqual(value("1"));
    expect(calculate(small, "*", small)).toBe(
      "Calculation exceeds the 4,096-digit precision limit. Total unchanged.",
    );
    expect(numericValue("1e-4096")).toBeNull();
  });
});
