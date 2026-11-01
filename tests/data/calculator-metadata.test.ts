import { expect, it } from "bun:test";
import { numericValue } from "../../src/lib/calculator.ts";
import { calculatorDisplayValue } from "../../src/lib/format.ts";

it("calculator metadata preserves displayed decimals and strips only rendered unit suffixes", () => {
  for (const [displayed, metadata] of [
    ["$1.987/L", "$1.987"],
    ["-$0.12345/L", "-$0.12345"],
    ["2.13 percentage points", "2.13"],
    ["-0.25 percentage points", "-0.25"],
    ["0 percentage points", "0"],
    ["$1,234.57", "$1,234.57"],
    ["12.5%", "12.5%"],
  ] as const) {
    expect(calculatorDisplayValue(displayed)).toBe(metadata);
    expect(numericValue(calculatorDisplayValue(displayed))).not.toBeNull();
  }
  for (const text of ["", "Unavailable", "Unavailable for 2026", "3 items", "$2/hour"]) {
    expect(calculatorDisplayValue(text)).toBe(text);
    expect(numericValue(calculatorDisplayValue(text))).toBeNull();
  }
});
