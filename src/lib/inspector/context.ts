import { getContext } from "svelte";
import type { Equation } from "../explanations/model.ts";

interface InspectionRequest {
  label: string;
  equations: () => readonly Equation[];
  trigger: HTMLElement;
}
interface InspectorContext {
  open: (request: InspectionRequest) => Promise<void>;
  active: (element: HTMLElement | undefined) => boolean;
}
const inspectorContext = Symbol("calculation-inspector");
function currentInspector(): InspectorContext | undefined {
  return getContext<InspectorContext | undefined>(inspectorContext);
}

export type { InspectionRequest, InspectorContext };
export { currentInspector, inspectorContext };
