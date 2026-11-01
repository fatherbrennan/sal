<script lang="ts">
import type { ComparisonResult } from "../calculations/comparison.ts";
import type { Fields } from "../data/model.d.ts";
import OneOffBreakdown from "./one-off-breakdown.svelte";

let {
  shown,
  recurring,
  profile,
  vehicle,
  timeValue,
}: {
  shown: { result: ComparisonResult }[];
  recurring: { result: ComparisonResult }[];
  profile: Fields;
  vehicle: Fields;
  timeValue: boolean;
} = $props();
</script>

<tbody>
  <tr>
    <th scope="row">One-off payments and costs</th>
    {#each shown as entry (entry.result.offer.id)}
      {@const prior = recurring.find(
        ({ result }) => result.offer.id === entry.result.offer.id,
      )?.result}
      <td>
        {#if prior}
          <OneOffBreakdown
            offer={entry.result.offer}
            recurring={prior}
            combined={entry.result}
            input={{
              offer: entry.result.offer,
              profile,
              vehicle,
              year: entry.result.tax.withOffer.input.year,
              ...entry.result.scenario,
              timeValue,
            }}
          />
        {:else}
          Select an earnings scenario including one-offs to view their combined effect.
        {/if}
      </td>
    {/each}
  </tr>
</tbody>

<style>
th,
td {
  border-bottom: 1px solid var(--divider);
  padding: 0.5rem 0.75rem;
  text-align: left;
  vertical-align: top;
}
th {
  position: sticky;
  left: 0;
  z-index: 1;
  background: var(--panel);
}
</style>
