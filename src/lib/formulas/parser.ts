import type { SalRecord } from "../data/model.d.ts";
import { readId } from "../data/validation.ts";
import { formulaReference } from "./catalogue.ts";

type Expression =
  | { kind: "number"; value: number }
  | { kind: "metric"; id: string }
  | { kind: "unary"; operator: string; operand: Expression }
  | { kind: "binary"; operator: string; left: Expression; right: Expression }
  | { kind: "call"; name: string; arguments: Expression[] }
  | { kind: "conditional"; condition: Expression; positive: Expression; negative: Expression };

const productPrecedence = 3;
const unaryPrecedence = 4;
const conditionalArguments = 3;
const maximumArguments = 100;
const percentScale = 100;
const precedence = new Map([
  ["=", 1],
  ["!=", 1],
  ["<>", 1],
  ["<", 1],
  ["<=", 1],
  [">", 1],
  [">=", 1],
  ["+", 2],
  ["-", 2],
  ["*", productPrecedence],
  ["/", productPrecedence],
]);
const functions = new Map([
  ["IF", [conditionalArguments, conditionalArguments]],
  ["MIN", [1, maximumArguments]],
  ["MAX", [1, maximumArguments]],
  ["ABS", [1, 1]],
  ["ROUND", [2, 2]],
]);
const tokenPattern =
  /\s*(?<token>\[[^\]\r\n]+\]|(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?%?|[a-zA-Z_][a-zA-Z0-9_]*|<=|>=|!=|<>|[+*/(),=<>-])/uy;
const numberStart = /^[\d.]/u;
const identifierStart = /^[a-z_]/iu;
const maximumLength = 8000;
const maximumTokens = 512;
const maximumDepth = 64;

function tokensFor(source: string, formulas: readonly SalRecord[]): string[] {
  if (source.length > maximumLength) {
    throw new Error("Use at most 8,000 characters in a formula.");
  }
  const tokens: string[] = [];
  let position = 0;
  while (position < source.trimEnd().length) {
    tokenPattern.lastIndex = position;
    const { token } = tokenPattern.exec(source)?.groups ?? {};
    if (token === undefined) {
      throw new Error(`Unexpected text at character ${position + 1}.`);
    }
    position = tokenPattern.lastIndex;
    if (token.startsWith("[")) {
      const reference = token.slice(1, -1);
      let canonical = reference;
      if (reference.startsWith("formula:")) {
        canonical = `formula:${readId(reference.slice("formula:".length))}`;
      } else {
        canonical = formulaReference(reference, formulas).id;
      }
      tokens.push(`[${canonical}]`);
    } else if (identifierStart.test(token) && !functions.has(token.toUpperCase())) {
      tokens.push(`[${formulaReference(token, formulas).id}]`);
    } else {
      tokens.push(token.toUpperCase());
    }
    if (tokens.length > maximumTokens) {
      throw new Error("Use at most 512 formula terms and symbols.");
    }
  }
  return tokens;
}

class FormulaParser {
  position = 0;
  references = new Set<string>();
  readonly tokens: string[];
  constructor(tokens: string[]) {
    this.tokens = tokens;
  }

  take(expected: string): void {
    if (this.tokens[this.position] !== expected) {
      throw new Error(`Expected ${expected} at term ${this.position + 1}.`);
    }
    this.position += 1;
  }

  call(name: string, depth: number): Expression {
    const limits = functions.get(name);
    if (!limits) {
      throw new Error(`Unknown function or value: ${name}.`);
    }
    this.take("(");
    const arguments_: Expression[] = [];
    if (this.tokens[this.position] !== ")") {
      arguments_.push(this.expression(0, depth + 1));
      while (this.tokens[this.position] === ",") {
        this.position += 1;
        arguments_.push(this.expression(0, depth + 1));
      }
    }
    this.take(")");
    const [minimum = 0, maximum = 0] = limits;
    if (arguments_.length < minimum || arguments_.length > maximum) {
      throw new Error(`${name} needs ${minimum} to ${maximum} arguments.`);
    }
    if (name === "IF") {
      const empty: Expression = { kind: "number", value: 0 };
      const [condition = empty, positive = empty, negative = empty] = arguments_;
      return { kind: "conditional", condition, positive, negative };
    }
    return { kind: "call", name, arguments: arguments_ };
  }

  atom(depth: number): Expression {
    const token = this.tokens[this.position];
    this.position += 1;
    if (token === undefined) {
      throw new Error("Enter a number, metric or function.");
    }
    if (token === "+" || token === "-") {
      return {
        kind: "unary",
        operator: token,
        operand: this.expression(unaryPrecedence, depth + 1),
      };
    }
    if (token === "(") {
      const inner = this.expression(0, depth + 1);
      this.take(")");
      return inner;
    }
    if (token.startsWith("[")) {
      const id = token.slice(1, -1);
      this.references.add(id);
      return { kind: "metric", id };
    }
    if (numberStart.test(token)) {
      let value = Number(token.replace("%", ""));
      if (token.endsWith("%")) {
        value /= percentScale;
      }
      if (!Number.isFinite(value)) {
        throw new Error("Numbers must be finite.");
      }
      return { kind: "number", value };
    }
    return this.call(token, depth);
  }

  expression(minimum: number, depth: number): Expression {
    if (depth > maximumDepth) {
      throw new Error("Use at most 64 levels of nested expressions.");
    }
    let left = this.atom(depth);
    while (this.position < this.tokens.length) {
      const operator = this.tokens[this.position] ?? "";
      const priority = precedence.get(operator) ?? -1;
      if (priority < minimum) {
        break;
      }
      this.position += 1;
      left = { kind: "binary", operator, left, right: this.expression(priority + 1, depth + 1) };
    }
    return left;
  }
}

function parseFormula(source: string, formulas: readonly SalRecord[] = []) {
  const tokens = tokensFor(source, formulas);
  const parser = new FormulaParser(tokens);
  const expression = parser.expression(0, 0);
  if (parser.position !== tokens.length) {
    throw new Error(`Unexpected term ${parser.position + 1}: ${tokens[parser.position]}.`);
  }
  return { expression, source: tokens.join(" "), references: [...parser.references] };
}

function formulaError(source: string, formulas: readonly SalRecord[] = []): string | null {
  if (source.trim() === "") {
    return null;
  }
  try {
    parseFormula(source, formulas);
    return null;
  } catch (failure) {
    return (failure instanceof Error && failure.message) || "Invalid formula.";
  }
}

export type { Expression };
export { formulaError, parseFormula };
