import { display } from "../format.ts";
import type { Inspection, InspectorNode } from "./types.ts";

function nodeAt(model: Inspection, id: string): InspectorNode {
  const node = model.nodes.get(id);
  if (node === undefined) {
    throw new Error(`Unknown inspector node: ${id}`);
  }
  return node;
}
function nodeValue(node: InspectorNode): string {
  if (node.valueText !== undefined) {
    return node.valueText;
  }
  if (node.symbol.endsWith("price_per_litre") && node.amount !== null) {
    return `$${node.amount}/L`;
  }
  return display(node.amount, node.unit);
}

export type { Inspection, InspectorNode } from "./types.ts";
export { nodeAt, nodeValue };
