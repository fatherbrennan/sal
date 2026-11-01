import type { ComparisonReference } from "../explanations/model.ts";

interface Term {
  id: string;
}
interface InspectorNode {
  reference?: ComparisonReference | undefined;
  container?: ComparisonReference | undefined;
  id: string;
  label: string;
  symbol: string;
  amount: number | null;
  unit: "money" | "number" | "percent";
  kind: "calculation" | "input" | "collection" | "rule";
  description: string;
  source: string;
  terms: Term[];
  method: string;
  alternative: string;
  formula?: { text: string; result: string; links: Record<string, string> }[];
  valueText?: string;
  related?: string[];
  notes?: readonly string[];
}
interface Inspection {
  offer: string;
  scenario: string;
  year?: string;
  nodes: Map<string, InspectorNode>;
}
const kindLabels = {
  input: "Entered input",
  rule: "Rule or model output",
  collection: "Itemised total",
  calculation: "Calculated value",
};
function currentLocation(active: boolean): "location" | undefined {
  if (active) {
    return "location";
  }
  return undefined;
}

export type { Inspection, InspectorNode, Term };
export { currentLocation, kindLabels };
