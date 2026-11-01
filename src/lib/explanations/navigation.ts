import type {
  ComparisonReference,
  Equation,
  EquationReference,
  EquationSection,
  EquationValue,
} from "./model.ts";
import {
  equationSections,
  formulaDocument,
  formulaParts,
  formulaTokens,
  primaryFormula,
} from "./presentation.ts";
import { variableOrigins } from "./variable-origins.ts";

interface DefinitionBlock {
  id: string;
  scope: string;
  title: string;
  formula: string;
  notes: readonly string[];
}
interface VariableScope {
  comparison?: ComparisonReference | undefined;
  container?: ComparisonReference | undefined;
  employment?: string;
  parent: string | null;
  title: string;
  values: Record<string, EquationValue>;
  units: Record<string, string>;
  origins: Record<string, string>;
  references: Record<string, EquationReference>;
  collections: Record<string, readonly EquationReference[]>;
  definitions: Map<string, DefinitionBlock[]>;
}
interface EquationGraph {
  scopes: Map<string, VariableScope>;
  blocks: DefinitionBlock[];
}
interface VariableTarget {
  comparison?: ComparisonReference | undefined;
  container?: ComparisonReference | undefined;
  employment: string;
  collection: boolean;
  scope: string;
  name: string;
  title: string;
  origin: string;
  value: EquationValue | undefined;
  unit: string;
  blocks: readonly DefinitionBlock[];
  members: readonly EquationReference[];
}

const operators = new Set([
  "sum",
  "count",
  "min",
  "max",
  "floor",
  "round",
  "each",
  "union",
  "unknown",
  "unavailable",
  "when",
  "otherwise",
  "for",
  "in",
  "the",
  "with",
  "without",
  "offer",
  "scenario",
  "using",
  "ordinary",
  "combined",
  "study",
  "loan",
  "coefficients",
  "minus",
  "and",
  "or",
  "true",
  "false",
]);
const definition = /(?:^|[;:])\s*(?<name>[a-z][a-z_0-9]*)(?:\([^\n=]*\))?\s*=(?!=)/gmu;
const comments = /#[^\n]*/gu;

function formulaVariables(formula: string): string[] {
  return [
    ...new Set(
      formulaParts(formula).flatMap((part) => {
        if (part.kind !== "formula") {
          return [];
        }
        return formulaTokens(part.text)
          .filter((token) => token.kind === "variable" && !operators.has(token.text))
          .map((token) => token.text);
      }),
    ),
  ];
}

function scopePath(parent: string, child: string): string {
  return [parent, child].filter(Boolean).join("/");
}

function collectValues(
  scope: VariableScope,
  section: EquationSection,
  parent: VariableScope | undefined,
): void {
  scope.employment = section.employment ?? scope.employment ?? parent?.employment ?? "employee";
  scope.comparison ??= section.comparison;
  scope.container = scope.comparison ?? parent?.container;
  Object.assign(scope.values, section.values);
  Object.assign(scope.units, section.units);
  if (section.result) {
    scope.values[section.result.name] = section.result.value;
    scope.units[section.result.name] = section.result.unit;
  }
}

function equationGraph(equation: Equation): EquationGraph {
  const graph: EquationGraph = { scopes: new Map(), blocks: [] };
  function collect(section: EquationSection, parent: string, id: string): void {
    const path = scopePath(parent, section.scope ?? "");
    let scope = graph.scopes.get(path);
    if (scope === undefined) {
      scope = {
        parent,
        title: section.title,
        values: {},
        units: {},
        origins: {},
        references: {},
        collections: {},
        definitions: new Map(),
      };
      graph.scopes.set(path, scope);
      if (path === "") {
        scope.parent = null;
      }
    }
    collectValues(scope, section, graph.scopes.get(parent));
    Object.assign(scope.origins, section.origins);
    Object.assign(scope.references, section.references);
    Object.assign(scope.collections, section.collections);
    const document = formulaDocument(section.formula);
    const block: DefinitionBlock = {
      id,
      scope: path,
      title: section.title,
      formula: document.formula,
      notes: [...(section.notes ?? []), ...document.notes],
    };
    graph.blocks.push(block);
    const names = new Set(
      formulaParts(section.formula).flatMap((part) => {
        if (part.kind !== "formula") {
          return [];
        }
        return [...part.text.replaceAll(comments, "").matchAll(definition)].flatMap((match) => {
          const { name } = match.groups ?? {};
          if (name === undefined) {
            return [];
          }
          return [name];
        });
      }),
    );
    for (const name of names) {
      const blocks = scope.definitions.get(name) ?? [];
      blocks.push(block);
      scope.definitions.set(name, blocks);
    }
    section.sections?.forEach((child, index) => {
      collect(child, path, `${id}-${index}`);
    });
  }
  collect(
    { ...equation, formula: primaryFormula(equation), sections: equationSections(equation) },
    "",
    "root",
  );
  return graph;
}

function resolveVariable(graph: EquationGraph, path: string, name: string): VariableTarget | null {
  const visited = new Set<string>();
  let current: string | null = path;
  let variable = name;
  while (current !== null) {
    const key = `${current}:${variable}`;
    if (visited.has(key)) {
      return null;
    }
    visited.add(key);
    const scope = graph.scopes.get(current);
    if (scope === undefined) {
      return null;
    }
    const reference = scope.references[variable];
    if (reference === undefined) {
      const target = localTarget(scope, current, variable);
      if (target !== null) {
        return target;
      }
      current = scope.parent;
    } else {
      current = scopePath(current, reference.scope);
      variable = reference.name;
    }
  }
  return null;
}

function localTarget(scope: VariableScope, path: string, name: string): VariableTarget | null {
  const blocks = scope.definitions.get(name) ?? [];
  let origin = scope.origins[name];
  if (scope.parent === null || Object.hasOwn(scope.values, name)) {
    origin ??= variableOrigins[name];
  }
  const collection = scope.collections[name];
  if (blocks.length === 0 && origin === undefined && collection === undefined) {
    return null;
  }
  return {
    comparison: scope.comparison,
    container: scope.container,
    employment: scope.employment ?? "employee",
    collection: collection !== undefined,
    scope: path,
    name,
    title: scope.title,
    origin:
      origin ?? variableOrigins[name] ?? "Calculated from the equations below in this context.",
    value: scope.values[name],
    unit: scope.units[name] ?? "number",
    blocks,
    members: (collection ?? []).map((member) => ({
      ...member,
      scope: scopePath(path, member.scope),
    })),
  };
}

function unresolvedVariables(graph: EquationGraph): string[] {
  const members = [...graph.scopes].flatMap(([path, scope]) =>
    Object.values(scope.collections).flatMap((collection) =>
      collection.map((member) => ({ ...member, scope: scopePath(path, member.scope) })),
    ),
  );
  return [
    ...new Set([
      ...graph.blocks.flatMap((block) =>
        formulaVariables(block.formula)
          .filter((name) => resolveVariable(graph, block.scope, name) === null)
          .map((name) => `${block.scope || "root"}:${name}`),
      ),
      ...members
        .filter(({ scope, name }) => resolveVariable(graph, scope, name) === null)
        .map(({ scope, name }) => `${scope}:${name}`),
    ]),
  ];
}

export type { DefinitionBlock, EquationGraph, VariableTarget };
export { equationGraph, formulaVariables, resolveVariable, scopePath, unresolvedVariables };
