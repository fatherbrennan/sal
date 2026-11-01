import { equationLabels } from "../comparison-labels.ts";
import { comparisonLabel } from "../comparison-presentation.ts";
import { comparisonMetrics } from "../explanations/comparison-reference.ts";
import { metricEquations } from "../explanations/metric-definitions.ts";
import type { Equation } from "../explanations/model.ts";
import {
  equationGraph,
  formulaVariables,
  resolveVariable,
  type VariableTarget,
} from "../explanations/navigation.ts";
import {
  displayValue,
  formattedFormulaTokens,
  formulaDocument,
  primaryFormula,
} from "../explanations/presentation.ts";
import type { Inspection, InspectorNode } from "./types.ts";

const assignment = /^(?:otherwise:\s*)?(?<name>[a-z][a-z_0-9]*)(?:\([^)]*\))?\s*=(?!=)/u;
const lineAssignments = /(?:^|[;:])\s*(?<name>[a-z][a-z_0-9]*)(?:\([^)]*\))?\s*=(?!=)/gu;
function definitionFor(formula: string, name: string): string {
  let selected = false;
  const definition = formulaDocument(formula)
    .formula.split("\n")
    .filter((line) => {
      const definitions = [...line.matchAll(lineAssignments)];
      if (definitions.length > 0) {
        selected = definitions.some((match) => {
          const { name: defined } = match.groups ?? {};
          return defined === name;
        });
      }
      return selected;
    })
    .join("\n");
  return formattedFormulaTokens(definition)
    .map((token) => token.text)
    .join("");
}
function targetId(target: { scope: string; name: string }): string {
  return `${target.scope}:${target.name}`;
}
function targetUnit(unit: string): InspectorNode["unit"] {
  if (unit === "money" || unit === "percent") {
    return unit;
  }
  return "number";
}
function targetNode(target: VariableTarget): InspectorNode {
  let amount: number | null = null;
  if (typeof target.value === "number") {
    amount = target.value;
  }
  let valueText = displayValue(target.value ?? null, target.unit);
  if (target.value === undefined) {
    valueText = "Formula only";
  }
  let kind: InspectorNode["kind"] = "rule";
  if (target.collection) {
    kind = "collection";
    valueText = `${target.members.length} items`;
    if (target.members.length === 0) {
      amount = 0;
      valueText = "No items";
    }
  }
  const metric = Object.entries(metricEquations).find(
    ([, definition]) => definition[0] === target.name,
  );
  let label = equationLabels[target.name] ?? target.name.replaceAll("_", " ");
  if (metric) {
    label = comparisonLabel(metric[0], target.employment);
  }
  const metricLabel = comparisonMetrics.get(target.name);
  let reference: InspectorNode["reference"];
  if (target.comparison && metricLabel) {
    reference = { key: target.comparison.key, metric: metricLabel };
  }
  return {
    reference,
    container: target.container,
    id: targetId(target),
    symbol: [target.scope.replaceAll("/", "_"), target.name].filter(Boolean).join("__"),
    label: `${label} · ${target.title}`,
    amount,
    valueText,
    unit: targetUnit(target.unit),
    kind,
    description: target.origin,
    source: `${target.title} → ${target.origin}`,
    terms: [],
    method: "",
    alternative: "",
    notes: [...new Set(target.blocks.flatMap((block) => block.notes))],
  };
}
function populate(
  node: InspectorNode,
  target: VariableTarget,
  graph: ReturnType<typeof equationGraph>,
  queue: VariableTarget[],
): void {
  function link(dependency: VariableTarget | null): string | undefined {
    if (!dependency || targetId(dependency) === node.id) {
      return undefined;
    }
    const id = targetId(dependency);
    queue.push(dependency);
    if (!node.terms.some((term) => term.id === id)) {
      node.terms.push({ id });
    }
    return id;
  }
  const formulas = [
    ...new Set(target.blocks.map((block) => definitionFor(block.formula, target.name))),
  ].filter(Boolean);
  node.formula = formulas.map((text) => {
    const links: Record<string, string> = {};
    for (const name of formulaVariables(text)) {
      const id = link(resolveVariable(graph, target.scope, name));
      if (id) {
        links[name] = id;
      }
    }
    return { text, result: target.name, links };
  });
  for (const member of target.members) {
    link(resolveVariable(graph, member.scope, member.name));
  }
  if (target.collection) {
    node.kind = "collection";
  } else if (node.terms.length > 0) {
    node.kind = "calculation";
  }
}
function singleEquation(
  equation: Equation,
  label: string,
): { nodes: Map<string, InspectorNode>; root: string } {
  const graph = equationGraph(equation);
  const { name: defined } = assignment.exec(primaryFormula(equation))?.groups ?? {};
  const name = equation.result?.name ?? defined ?? "calculation";
  const target = resolveVariable(graph, "", name);
  const nodes = new Map<string, InspectorNode>();
  const queue: VariableTarget[] = [];
  if (target) {
    queue.push(target);
  }
  for (const item of queue) {
    const key = targetId(item);
    if (!nodes.has(key)) {
      const node = targetNode(item);
      nodes.set(key, node);
      populate(node, item, graph, queue);
    }
  }
  const root = targetId(target ?? { scope: "", name });
  let node = nodes.get(root);
  if (!node) {
    node = targetNode({
      scope: "",
      employment: equation.employment ?? "employee",
      name,
      title: equation.title,
      origin: equation.context ?? label,
      value: null,
      unit: "number",
      blocks: [],
      members: [],
      collection: false,
    });
    node.valueText = "Inputs and rules";
    const document = formulaDocument(primaryFormula(equation));
    node.notes = document.notes;
    node.formula = [];
    if (document.formula) {
      node.formula.push({ text: document.formula, result: name, links: {} });
    }
  }
  nodes.set(root, {
    ...node,
    label: `${label} · ${equation.title}`,
    description: [equation.context, ...(equation.warnings ?? [])].filter(Boolean).join(" "),
    notes: [
      ...new Set([
        ...equation.notes,
        ...formulaDocument(equation.formula).notes,
        ...(node.notes ?? []),
      ]),
    ],
  });
  return { nodes, root };
}
function scopedEquation(equation: Equation, label: string, prefix: string) {
  const model = singleEquation(equation, label);
  const nodes = [...model.nodes.values()].map((node): [string, InspectorNode] => {
    const id = `${prefix}${node.id}`;
    return [
      id,
      {
        ...node,
        id,
        terms: node.terms.map((term) => ({ ...term, id: `${prefix}${term.id}` })),
        formula: (node.formula ?? []).map((formula) => ({
          ...formula,
          links: Object.fromEntries(
            Object.entries(formula.links).map(([name, target]) => [name, `${prefix}${target}`]),
          ),
        })),
      },
    ];
  });
  return { nodes, root: `${prefix}${model.root}` };
}
function equationInspection(
  equations: readonly Equation[],
  label: string,
): Inspection & { root: string } {
  const parts = equations.map((equation, index) => scopedEquation(equation, label, `${index}:`));
  const nodes = new Map(parts.flatMap((part) => part.nodes));
  const roots = parts.map((part) => part.root);
  const [root] = roots;
  if (root === undefined) {
    throw new Error("No calculation was supplied.");
  }
  for (const id of roots) {
    const node = nodes.get(id);
    if (node) {
      node.related = roots.filter((other) => other !== id);
    }
  }
  return {
    offer: equations[0]?.title ?? label,
    scenario: equations[0]?.context ?? "",
    nodes,
    root,
  };
}

export { definitionFor, equationInspection, singleEquation };
