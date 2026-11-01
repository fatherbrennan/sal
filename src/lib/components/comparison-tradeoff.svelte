<script lang="ts">
import type { ComparisonResult, Metric } from "../calculations/comparison.ts";
import { timeTradeoff } from "../calculations/comparison-insights.ts";

let {
  entries,
  baseline,
}: {
  entries: {
    result: ComparisonResult;
    guaranteed: ComparisonResult | undefined;
    target: ComparisonResult | undefined;
    metrics: Metric[];
  }[];
  baseline: ComparisonResult | undefined;
} = $props();
</script>

<tbody>
  <tr>
    <th scope="row">
      Cash and time vs baseline<small
        >Named dimensions only; consider the offer's conditions and fit.</small
      >
    </th>
    {#each entries as entry (entry.result.offer.id)}
      <td>
        {#if entry.result.offer.id === baseline?.offer.id}
          Baseline
        {:else}
          <span>{timeTradeoff(entry.result, baseline)}</span>
        {/if}
      </td>
    {/each}
  </tr>
</tbody>

<style>
th,
td {
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--divider);
  min-width: 12rem;
  text-align: right;
  vertical-align: top;
}
th {
  position: sticky;
  left: 0;
  z-index: 1;
  background: var(--panel);
  text-align: left;
  max-width: 17rem;
}
small {
  display: block;
  font-size: var(--text-small);
  color: var(--muted);
  font-weight: var(--weight-regular);
  margin-top: 0.3rem;
}
</style>
