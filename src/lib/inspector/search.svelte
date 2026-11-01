<script lang="ts">
import Combobox, { type Selection } from "../components/combobox.svelte";
import { calculatorDisplayValue } from "../format.ts";
import { nodeValue } from "./model.ts";
import type { InspectorNode } from "./types.ts";

let props: Selection & { nodes: Map<string, InspectorNode> } = $props();
const options = $derived(
  [...props.nodes.values()].map((node) => ({
    id: node.id,
    label: node.label,
    keywords: node.symbol,
  })),
);
</script>

<Combobox
  {...props}
  {options}
  label="Search values and inputs"
  listLabel="Values and inputs"
  placeholder="Search values and inputs…"
>
  {#snippet optionDetail(option)}
    {@const node = props.nodes.get(option.id)}
    {#if node}
      <span class="secondary"
        ><code>{node.symbol}</code>
        ·
        <span
          class:numeric={node.amount !== null && node.kind !== "collection"}
          data-calculator-value={(node.amount !== null &&
            node.kind !== "collection" &&
            calculatorDisplayValue(nodeValue(node))) ||
            ""}
          data-calculator-label={node.symbol}
          >{nodeValue(node)}</span
        ></span
      >
    {/if}
  {/snippet}
</Combobox>

<style>
.secondary {
  color: var(--muted);
  font-size: var(--text-small);
}
code {
  font-size: inherit;
}
</style>
