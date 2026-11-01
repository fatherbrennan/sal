<script lang="ts">
import type { ComparisonResult } from "../calculations/comparison.ts";
import { type MissingInput, missingInputs } from "../result-presentation.ts";

let {
  result,
  onresolve,
}: {
  result: ComparisonResult;
  onresolve: (input: MissingInput) => void;
} = $props();
let missing = $derived(missingInputs(result));
let tax = $derived(result.tax.incrementalTax);
let unavailable = $derived(result.metrics.filter(({ amount }) => amount === null).length);
</script>

<div class="readiness">
  {#if missing.length > 0}
    <details>
      <summary>{missing.length} unanswered inputs — review</summary>
      <p>Blank means unknown; answers may affect different results.</p>
      <ul>
        {#each missing as input (`${input.scope}:${input.target}`)}
          <li>
            <button type="button" onclick={() => onresolve(input)}>Enter {input.label}</button>
          </li>
        {/each}
      </ul>
    </details>
  {:else if unavailable > 0}
    <p>Some results are unavailable. Their calculation details explain why.</p>
  {/if}
  {#if tax.status === "unavailable"}
    <p class="limitation">
      <strong
        >{#if tax.code === "missing-input"}
          Tax estimate needs input
        {:else if tax.code === "invalid-input"}
          Check tax inputs
        {:else}
          Tax calculation not supported
        {/if}
        :</strong
      >
      {tax.reason}
    </p>
  {/if}
</div>

<style>
.readiness {
  font-size: var(--text-small);
}
p {
  margin-block: 0.4rem;
  color: var(--muted);
}
ul {
  margin-block: 0.5rem;
  padding-left: 1.25rem;
}
li {
  margin-block: 0.25rem;
}
button {
  text-align: left;
  font-weight: var(--weight-regular);
}
.limitation {
  border-left: 3px solid var(--line);
  padding-left: 0.65rem;
}
</style>
