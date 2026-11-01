<script lang="ts">
import type { ComparisonResult } from "../calculations/comparison.ts";
import { isLeaveMetric, leaveReason } from "../calculations/leave-metrics.ts";
import { comparisonLabel } from "../comparison-presentation.ts";
import type { Equation } from "../explanations/model.ts";
import { leaveInput } from "../leave-input.ts";
import { type MissingInput, missingInputs } from "../result-presentation.ts";
import EquationPopup from "./equation-popup.svelte";

let {
  id,
  result,
  label,
  explain,
  onresolve,
  onclose,
}: {
  id: string;
  result: ComparisonResult;
  label: string;
  explain: (result: ComparisonResult, label: string) => Equation;
  onresolve: (offerId: string, input: MissingInput, metric?: string) => void;
  onclose: () => Promise<void>;
} = $props();
let input = $derived(leaveInput(result, label));
</script>

<section aria-label="Selected result inputs">
  <h3 {id} tabindex="-1">{comparisonLabel(label)} · {result.offer.name}</h3>
  {#if isLeaveMetric(label)}
    <p>{leaveReason(result, label)}</p>
  {/if}
  {#if input}
    {@const target = input}
    <button type="button" onclick={() => onresolve(result.offer.id, target, label)}>
      Enter {input.label}
    </button>
  {:else}
    <EquationPopup
      label="Inspect this result’s dependencies and conditions"
      equations={() => [explain(result, label)]}
    />
  {/if}
  <details>
    <summary>Other unanswered inputs for this offer</summary>
    <p>These inputs affect different results; they are not all required for the selected metric.</p>
    {#each missingInputs(result) as other (`${other.scope}:${other.target}`)}
      <button type="button" onclick={() => onresolve(result.offer.id, other, label)}>
        Enter {other.label}
      </button>
    {/each}
  </details>
  <button type="button" onclick={onclose}>Return to result</button>
</section>

<style>
section {
  border-left: 2px solid var(--accent);
  padding: 0.5rem;
  margin-block: 0.5rem;
  background: var(--soft);
}
details button {
  display: block;
  margin-block: 0.25rem;
}
</style>
