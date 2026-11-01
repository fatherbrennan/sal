<script lang="ts">
import { calculateComparison } from "../calculations/comparison.ts";
import { value } from "../calculations/inputs.ts";
import type { TaxYear } from "../calculations/tax/types.d.ts";
import { metricNotes } from "../comparison-labels.ts";
import { comparisonLabel } from "../comparison-presentation.ts";
import type { Fields, SalRecord } from "../data/model.d.ts";
import { comparisonEquation } from "../explanations/comparison.ts";
import { comparisonVariables } from "../explanations/comparison-reference.ts";
import { display } from "../format.ts";
import type { MissingInput } from "../result-presentation.ts";
import EquationPopup from "./equation-popup.svelte";
import ResultReadiness from "./result-readiness.svelte";

let {
  offer,
  profile,
  vehicle,
  year,
  onresolve,
}: {
  offer: SalRecord;
  profile: Fields;
  vehicle: Fields;
  year: TaxYear;
  onresolve: (input: MissingInput) => void;
} = $props();
let input = $derived({
  offer,
  profile,
  vehicle,
  year,
  target: false,
  oneOff: false,
  timeValue: true,
});
let result = $derived(calculateComparison(input));
const labels = [
  "Package value after tax, commuting costs and time",
  "Cash after tax and personal super",
  "Cash + super after tax per paid hour",
  "Package value before tax and costs",
  "Package value after tax",
  "Cash + super after tax",
  "Package value after tax and commuting costs",
];
const primaryCount = 3;
</script>

<section class="offer-summary" aria-label="Live offer summary">
  <h3>Offer summary <span>{year} · guaranteed · recurring · AUD</span></h3>
  {@render values(labels.slice(0, primaryCount))}
  <details data-disclosure="More offer values">
    <summary>More values</summary>
    {@render values(labels.slice(primaryCount))}
    <p>Other job costs, target earnings and one-offs are in Comparisons.</p>
  </details>
  <ResultReadiness {result} {onresolve} />
</section>

{#snippet values(metrics: string[])}
  <dl>
    {#each metrics as label (label)}
      {@const amount = result.metrics.find((metric) => metric.label === label)?.amount ?? null}
      <div>
        <dt>
          <EquationPopup
            label={comparisonLabel(label, value(offer.fields, "employment"))}
            equations={() => [comparisonEquation(label, input, result)]}
          />
          {#if metricNotes[label]}
            <small>{metricNotes[label]}</small>
          {/if}
        </dt>
        <dd
          class:numeric={amount !== null}
          data-calculator-value={(amount !== null && display(amount)) || ""}
          data-calculator-label={`${offer.id}::${comparisonVariables.get(label)}`}
        >
          {display(amount)}
        </dd>
      </div>
    {/each}
  </dl>
{/snippet}

<style>
.offer-summary {
  border-block: 2px solid var(--accent);
  padding: 0.4rem 0;
  margin-bottom: 0.5rem;
}
h3 {
  margin: 0;
}
h3 span,
p {
  color: var(--muted);
  font-size: var(--text-small);
  font-weight: var(--weight-regular);
}
h3 span {
  display: inline-block;
  margin-left: 0.5rem;
}
p {
  margin-block: 0.35rem;
}
dl {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 14rem), 1fr));
  gap: 0.5rem 1rem;
  margin-block: 0.5rem;
}
details {
  border: 0;
  padding: 0;
  margin: 0;
}
small {
  display: block;
  font-size: var(--text-small);
}
dt {
  color: var(--muted);
  font-size: var(--text-small);
}
dd {
  margin: 0.25rem 0 0;
  overflow-wrap: anywhere;
}
dd.numeric {
  font-size: var(--text-page);
  font-weight: var(--weight-medium);
  line-height: var(--leading-heading);
  font-variant-numeric: tabular-nums;
}
</style>
