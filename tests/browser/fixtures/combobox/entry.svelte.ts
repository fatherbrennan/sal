import { mount } from "svelte";
import Search from "../../../../src/lib/inspector/search.svelte";
import type { InspectorNode } from "../../../../src/lib/inspector/types.ts";

const nodes = new Map<string, InspectorNode>(
  ["Alpha", "Beta", "Gamma"].map((label) => [
    label,
    {
      id: label,
      label,
      symbol: label.toLowerCase(),
      amount: 1,
      unit: "number",
      kind: "input",
      description: "",
      source: "",
      terms: [],
      method: "",
      alternative: "",
    },
  ]),
);
let selected = $state<readonly string[]>(["Alpha"]);
let single = $state("Alpha");
const multipleRegion = document.createElement("section");
multipleRegion.setAttribute("aria-label", "Multiple selection");
const singleRegion = document.createElement("section");
singleRegion.setAttribute("aria-label", "Single selection");
document.body.replaceChildren(multipleRegion, singleRegion);
mount(Search, {
  target: multipleRegion,
  props: {
    nodes,
    multiple: true,
    get selected() {
      return selected;
    },
    onselect(ids: string[]) {
      selected = ids;
    },
  },
});
mount(Search, {
  target: singleRegion,
  props: {
    nodes,
    get selected() {
      return single;
    },
    onselect(id: string) {
      single = id;
    },
  },
});
