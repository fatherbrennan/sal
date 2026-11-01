import type { Equation, EquationSection, EquationValue } from "./model.ts";

const assignment = /^(?<variable>[a-z][a-z_0-9]*)\s*=/u;
const formulaLine = /^\s*(?:[a-z][a-z_0-9]*(?:\([^)]*\))?\s*[=<>]|otherwise:\s+[a-z])/u;
const continuationLine = /^\s*(?:[+*/%()-]|[a-z][a-z_0-9]*[),])/u;
const valueToken = /^(?:[+-]?\d|"|unknown$)/u;
const variableToken = /^[a-z][a-z_0-9]*$/u;
const commentPrefix = /^#\s*/u;
const functionGap = /^ +(?=[([])/u;

function primaryFormula(equation: Equation): string {
  return equation.formula.split("\n\n")[0] ?? "";
}

function formulaValues(formula: string, values: Equation["values"]): Equation["values"] {
  const names = new Set(formula.replaceAll(/#[^\n]*/gu, "").match(/[a-z][a-z_0-9]*/gu));
  const { variable } = assignment.exec(formula)?.groups ?? {};
  if (variable !== undefined) {
    names.delete(variable);
  }
  return Object.fromEntries(
    [...names]
      .filter((name) => Object.hasOwn(values, name))
      .map((name) => [name, values[name] ?? null]),
  );
}

function equationSections(equation: Equation): readonly EquationSection[] {
  if (equation.sections !== undefined) {
    return equation.sections;
  }
  return [...new Set(equation.formula.split("\n\n").slice(1))]
    .filter((formula) => formula.trim() !== "")
    .map((formula) => {
      const first = formula.split("\n")[0] ?? "";
      const { variable } = assignment.exec(first)?.groups ?? {};
      let title = first;
      if (variable !== undefined) {
        title = variable.replaceAll("_", " ");
        title = title.charAt(0).toUpperCase() + title.slice(1);
      }
      return { title, formula };
    });
}

function displayValue(value: EquationValue, unit = "number"): string {
  if (value === null) {
    return "Unavailable";
  }
  if (typeof value === "number") {
    if (unit === "money") {
      return value.toLocaleString("en-AU", { style: "currency", currency: "AUD" });
    }
    if (unit === "percent") {
      return `${value.toLocaleString("en-AU", { maximumFractionDigits: 2 })}%`;
    }
    if (unit === "percentage points") {
      return `${value.toLocaleString("en-AU", { maximumFractionDigits: 2 })} percentage points`;
    }
    return value.toLocaleString("en-AU", { maximumFractionDigits: 4 });
  }
  if (typeof value === "string") {
    return value;
  }
  return value.map((entry) => displayValue(entry)).join(", ");
}

interface FormulaPart {
  kind: "formula" | "note";
  text: string;
}

function formulaParts(source: string): FormulaPart[] {
  const parts: FormulaPart[] = [];
  for (const line of source.split("\n")) {
    const previous = parts.at(-1);
    let kind: FormulaPart["kind"] = "note";
    if (formulaLine.test(line) || (previous?.kind === "formula" && continuationLine.test(line))) {
      kind = "formula";
    }
    if (previous?.kind === kind) {
      previous.text += `\n${line}`;
    } else {
      parts.push({ kind, text: line });
    }
  }
  return parts.filter((part) => part.text.trim() !== "");
}

function formulaDocument(source: string): { formula: string; notes: string[] } {
  const formulas: string[] = [];
  const notes: string[] = [];
  for (const part of formulaParts(source)) {
    if (part.kind === "note") {
      notes.push(part.text.trim().replace(commentPrefix, ""));
    } else {
      const code = formulaTokens(part.text).filter((token) => {
        if (token.kind === "comment") {
          notes.push(token.text.slice(1).trim());
          return false;
        }
        return true;
      });
      formulas.push(
        code
          .map((token) => token.text)
          .join("")
          .trim(),
      );
    }
  }
  return { formula: formulas.join("\n"), notes: [...new Set(notes.filter(Boolean))] };
}

function formulaTokens(source: string): { kind: string; text: string }[] {
  return source
    .split(
      /(?<token>#[^\n]*|"(?:\\.|[^"\\\n])*"|(?:(?<=^\s*|[=(,:*/+\-<>[]\s*)[+-])?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b|\b[a-z][a-z_0-9]*\b)/gu,
    )
    .map((text) => {
      let kind = "operator";
      if (text.startsWith("#")) {
        kind = "comment";
      } else if (valueToken.test(text)) {
        kind = "value";
      } else if (variableToken.test(text)) {
        kind = "variable";
      }
      return { kind, text };
    });
}

function formattedFormulaTokens(source: string): { kind: string; text: string }[] {
  return formulaTokens(source.trim())
    .map((token, index, tokens) => {
      if (token.kind !== "operator") {
        return token;
      }
      let text = token.text
        .replaceAll(/[^\S\n]+/gu, " ")
        .replaceAll(/ *\n */gu, "\n")
        .replaceAll(/(?<bracket>[([]) +/gu, "$<bracket>")
        .replaceAll(/ +(?<punctuation>[)\],;])/gu, "$<punctuation>");
      if (tokens[index - 1]?.kind === "variable") {
        text = text.replace(functionGap, "");
      }
      return { ...token, text };
    })
    .filter((token) => token.text !== "");
}

function readableFormula(equation: Equation, substitute = false): string {
  const rounded =
    substitute &&
    formulaTokens(primaryFormula(equation)).some((part) =>
      roundedValue(equation.values[part.text], equation.units?.[part.text]),
    );
  return formattedFormulaTokens(primaryFormula(equation))
    .map((part) => {
      if (part.kind === "variable") {
        if (substitute && Object.hasOwn(equation.values, part.text)) {
          return displayValue(equation.values[part.text] ?? null, equation.units?.[part.text]);
        }
        return part.text.replaceAll("_", " ");
      }
      if (part.kind === "operator") {
        let operator = part.text.replaceAll("*", "×").replaceAll("/", "÷");
        if (rounded) {
          operator = operator.replace(/(?<![<>=!])=(?!=)/gu, "≈");
        }
        return operator;
      }
      if (part.kind === "comment") {
        return part.text.replace("#", "—");
      }
      return part.text;
    })
    .join("");
}

function roundedValue(value: EquationValue | undefined, unit = "number"): boolean {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return false;
  }
  const standardDigits = 4;
  const moneyDigits = 2;
  let digits = standardDigits;
  if (["money", "percent", "percentage points"].includes(unit)) {
    digits = moneyDigits;
  }
  return Number(value.toFixed(digits)) !== value;
}

export {
  displayValue,
  equationSections,
  formattedFormulaTokens,
  formulaDocument,
  formulaParts,
  formulaTokens,
  formulaValues,
  primaryFormula,
  readableFormula,
};
