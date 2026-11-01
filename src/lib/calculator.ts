type Operator = "+" | "-" | "*" | "/";
interface CalculatorNumber {
  readonly numerator: bigint;
  readonly denominator: bigint;
}
interface Calculation {
  before: CalculatorNumber;
  operator: Operator;
  operand: CalculatorNumber;
  result: CalculatorNumber;
}
const currencyPrefix = /^(?<before>[+-]?)\$(?<after>[+-]?)/u;
const numberPattern = /^[+-]?(?:(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?|\.\d+)(?:e[+-]?\d+)?%?$/iu;
const percentSuffix = /%$/u;
const trailingZeros = /\.?0+$/u;
const groupThousands = /\B(?=(?:\d{3})+(?!\d))/gu;
const digitLimit = 4096;
const displayDigits = 15;
const decimalBase = 10n;
const maximumMagnitude = BigInt(Number.MAX_VALUE);
const zeroCalculatorValue = Object.freeze({ numerator: 0n, denominator: 1n });

function isOperator(key: string): key is Operator {
  return key === "+" || key === "-" || key === "*" || key === "/";
}

function absolute(value: bigint): bigint {
  if (value < 0n) {
    return -value;
  }
  return value;
}

function reduced(numerator: bigint, denominator: bigint): CalculatorNumber {
  let left = absolute(numerator);
  let right = absolute(denominator);
  while (right !== 0n) {
    [left, right] = [right, left % right];
  }
  if (denominator < 0n) {
    left = -left;
  }
  return { numerator: numerator / left, denominator: denominator / left };
}

function withinLimits(value: CalculatorNumber): boolean {
  return (
    absolute(value.numerator).toString().length <= digitLimit &&
    value.denominator.toString().length <= digitLimit
  );
}

function numericValue(text: string): CalculatorNumber | null {
  if (text.length > digitLimit) {
    return null;
  }
  const cleaned = text.trim().replaceAll("−", "-").replace(currencyPrefix, "$<before>$<after>");
  if (!numberPattern.test(cleaned)) {
    return null;
  }
  const [mantissa = "", exponentText = "0"] = cleaned
    .replaceAll(",", "")
    .replace(percentSuffix, "")
    .toLowerCase()
    .split("e");
  const exponent = Number(exponentText);
  if (Math.abs(exponent) > digitLimit) {
    return null;
  }
  const fractionDigits = mantissa.split(".")[1]?.length ?? 0;
  const scale = fractionDigits - exponent;
  const digits = BigInt(mantissa.replace(".", ""));
  const value = reduced(
    digits * decimalBase ** BigInt(Math.max(0, -scale)),
    decimalBase ** BigInt(Math.max(0, scale)),
  );
  if (!withinLimits(value) || absolute(value.numerator) > maximumMagnitude * value.denominator) {
    return null;
  }
  return value;
}

function calculate(
  before: CalculatorNumber,
  operator: Operator,
  operand: CalculatorNumber,
): Calculation | string {
  if (before.denominator <= 0n || operand.denominator <= 0n) {
    return "Enter a finite number.";
  }
  if (operator === "/" && operand.numerator === 0n) {
    return "Cannot divide by zero. Total unchanged.";
  }
  let numerator: bigint;
  let denominator = before.denominator * operand.denominator;
  switch (operator) {
    case "+":
      numerator = before.numerator * operand.denominator + operand.numerator * before.denominator;
      break;
    case "-":
      numerator = before.numerator * operand.denominator - operand.numerator * before.denominator;
      break;
    case "*":
      numerator = before.numerator * operand.numerator;
      break;
    default:
      numerator = before.numerator * operand.denominator;
      denominator = before.denominator * operand.numerator;
      break;
  }
  const result = reduced(numerator, denominator);
  if (!withinLimits(result)) {
    return "Calculation exceeds the 4,096-digit precision limit. Total unchanged.";
  }
  if (absolute(result.numerator) > maximumMagnitude * result.denominator) {
    return "Result is too large. Total unchanged.";
  }
  return { before, operator, operand, result };
}

function formatCalculatorValue(value: CalculatorNumber): { text: string; rounded: boolean } {
  if (value.numerator === 0n) {
    return { text: "0", rounded: false };
  }
  const magnitude = absolute(value.numerator);
  let exponent = magnitude.toString().length - value.denominator.toString().length;
  const belowPower =
    magnitude * decimalBase ** BigInt(Math.max(0, -exponent)) <
    value.denominator * decimalBase ** BigInt(Math.max(0, exponent));
  if (belowPower) {
    exponent -= 1;
  }
  const scale = displayDigits - 1 - exponent;
  const numerator = magnitude * decimalBase ** BigInt(Math.max(0, scale));
  const denominator = value.denominator * decimalBase ** BigInt(Math.max(0, -scale));
  const remainder = numerator % denominator;
  let rounded = numerator / denominator;
  if (remainder * 2n >= denominator) {
    rounded += 1n;
  }
  let text = rounded.toString();
  if (scale > 0) {
    text = text.padStart(scale + 1, "0");
    text = `${text.slice(0, -scale)}.${text.slice(-scale)}`.replace(trailingZeros, "");
  } else {
    text += "0".repeat(-scale);
  }
  const [whole = "", fraction] = text.split(".");
  text = whole.replace(groupThousands, ",");
  if (fraction) {
    text += `.${fraction}`;
  }
  if (value.numerator < 0n) {
    text = `-${text}`;
  }
  return { text, rounded: remainder !== 0n };
}

export type { Calculation, CalculatorNumber, Operator };
export { calculate, formatCalculatorValue, isOperator, numericValue, zeroCalculatorValue };
