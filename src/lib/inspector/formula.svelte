<script lang="ts">
import { formattedFormulaTokens } from "../explanations/presentation.ts";
import Hint from "./hint.svelte";
import { type Inspection, type InspectorNode, nodeAt, nodeValue } from "./model.ts";

let {
  model,
  node,
  selected,
  onselect,
}: {
  model: Inspection;
  node: InspectorNode;
  selected: string;
  onselect: (id: string) => void;
} = $props();
</script>

{#if node.formula?.length}
  <div class="formula">
    {#each node.formula as formula, formulaIndex (formulaIndex)}
      <code class="source-formula"
        >{#each formattedFormulaTokens(formula.text) as token, tokenIndex (tokenIndex)}
          {@const id = formula.links[token.text]}
          {#if id}
            {@const input = nodeAt(model, id)}
            <Hint
              label={input.symbol}
              text={`${input.label} · ${nodeValue(input)}\n${input.description}`}
              active={selected === input.id}
              onactivate={() => onselect(input.id)}
            />
          {:else if token.kind === "variable" && token.text === formula.result}
            <span class:current={selected === node.id}>{node.symbol}</span>
          {:else}
            {token.text}
          {/if}
        {/each}</code
      >
    {/each}
  </div>
{/if}

<style>
.formula {
  padding: 0.4rem;
  background: var(--soft);
  border-left: 3px solid var(--accent);
  line-height: var(--leading-body);
  font-size: var(--text-small);
  overflow-wrap: anywhere;
}
.current {
  background: var(--accent);
  color: var(--panel);
  font-weight: var(--weight-medium);
}
.source-formula {
  display: block;
  font-size: inherit;
  white-space: pre-wrap;
}
.formula .source-formula :global(button) {
  min-height: 0;
  padding: 0;
  line-height: var(--leading-compact);
}
</style>
