<script lang="ts">
import type { ComparisonResult } from "../calculations/comparison.ts";
import { metricAmount } from "../calculations/comparison-insights.ts";
import { value } from "../calculations/inputs.ts";
import { comparisonBasis } from "../comparison-overview.ts";

let { results }: { results: ComparisonResult[] } = $props();
let costMethods = $derived(
  new Set(
    results
      .filter((result) => metricAmount(result, "Return commute journeys") !== 0)
      .map((result) => value(result.payer, "costMethod")),
  ),
);
</script>

<tbody>
  {#if costMethods.has("ato") && costMethods.has("entered")}
    <tr>
      <td colspan={results.length + 1} class="mixed-costs">
        Mixed cost bases: some offers use entered running costs; others use the broader ATO estimate
        including ownership costs. Cash-after-cost differences are not a like-for-like spending
        comparison.
      </td>
    </tr>
  {/if}
  <tr>
    <th scope="row">Calculation basis</th>
    {#each results as result (result.offer.id)}
      <td>
        {#each comparisonBasis(result) as note (note)}
          <p>{note}</p>
        {/each}
      </td>
    {/each}
  </tr>
</tbody>

<style>
th,
td {
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--divider);
  text-align: right;
  vertical-align: top;
  min-width: 12rem;
  color: var(--muted);
  font-size: var(--text-small);
}
th {
  position: sticky;
  left: 0;
  z-index: 1;
  background: var(--panel);
  text-align: left;
  max-width: 17rem;
}
p {
  margin: 0;
}
p + p {
  margin-top: 0.3rem;
}
</style>
