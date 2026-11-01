type EquationValue = number | string | null | readonly (number | string | null)[];
interface ComparisonReference {
  key: string;
  metric: string;
}
interface EquationReference {
  scope: string;
  name: string;
}
interface EquationSection {
  comparison?: ComparisonReference;
  employment?: string;
  result?: { name: string; value: EquationValue; unit: string };
  title: string;
  formula: string;
  values?: Readonly<Record<string, EquationValue>>;
  notes?: readonly string[];
  sections?: readonly EquationSection[];
  scope?: string;
  units?: Readonly<Record<string, string>>;
  references?: Readonly<Record<string, EquationReference>>;
  origins?: Readonly<Record<string, string>>;
  collections?: Readonly<Record<string, readonly EquationReference[]>>;
}
interface Equation {
  comparison?: ComparisonReference;
  employment?: string;
  title: string;
  formula: string;
  values: Readonly<Record<string, EquationValue>>;
  notes: readonly string[];
  context?: string;
  units?: Readonly<Record<string, string>>;
  warnings?: readonly string[];
  sections?: readonly EquationSection[];
  result?: { name: string; value: EquationValue; unit: string };
  references?: Readonly<Record<string, EquationReference>>;
  origins?: Readonly<Record<string, string>>;
  collections?: Readonly<Record<string, readonly EquationReference[]>>;
}

function explanation(
  title: string,
  formula: string,
  values: Readonly<Record<string, EquationValue>> = {},
  notes: readonly string[] = [],
): Equation {
  const names = new Set(formula.match(/[a-z][a-z_0-9]*/gu));
  return {
    title,
    formula,
    values: Object.fromEntries(
      Object.entries(values)
        .map(([key, value]): [string, EquationValue] => [
          key.replaceAll(/[A-Z]/gu, (letter) => `_${letter.toLowerCase()}`),
          value,
        ])
        .filter(
          ([key]) => typeof key === "string" && (key === "displayed_result" || names.has(key)),
        ),
    ),
    notes,
  };
}

function equationValues(values: Equation["values"]): string {
  return Object.entries(values)
    .filter(([key]) => key !== "displayed_result")
    .map(([key, value]) => {
      if (value === null) {
        return `${key} = unknown`;
      }
      return `${key} = ${JSON.stringify(value)}`;
    })
    .join("\n");
}

export type { ComparisonReference, Equation, EquationReference, EquationSection, EquationValue };
export { equationValues, explanation };
