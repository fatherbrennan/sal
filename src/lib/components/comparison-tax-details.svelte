<script lang="ts">
import type { ComparisonResult } from "../calculations/comparison.ts";
import { value } from "../calculations/inputs.ts";
import type { TaxYear } from "../calculations/tax/types.d.ts";
import type { SalRecord } from "../data/model.d.ts";
import type { MissingInput } from "../result-presentation.ts";
import ResultReadiness from "./result-readiness.svelte";
import TaxBreakdown from "./tax-breakdown.svelte";

let {
  open,
  shown,
  year,
  selectId,
  onresolve,
}: {
  open: boolean;
  shown: { offer: SalRecord; result: ComparisonResult }[];
  year: TaxYear;
  selectId: string;
  onresolve: (offerId: string, input: MissingInput) => void;
} = $props();
</script>

<details {open} class="tax-details">
  <summary>Tax calculations and offer limitations</summary>
  {#each shown as entry (entry.offer.id)}
    <details id={`${selectId}-${entry.offer.id}`}>
      <summary>{entry.offer.name || "Untitled offer"} — breakdown and limitations</summary>
      <ResultReadiness
        result={entry.result}
        onresolve={(input) => onresolve(entry.offer.id, input)}
      />
      {#if value(entry.offer.fields, "employment") === "sole-trader"}
        <p>
          Contractor results compare revenue less expenses and estimated tax. They do not forecast
          bank deposits, invoice receipts, GST settlements or withholding timing. Business
          deductions exceeding revenue require separately established loss rules and leave
          tax-dependent results unavailable.
        </p>
      {/if}
      <ul>
        {#each entry.result.notes as note (note)}
          <li>{note}</li>
        {/each}
      </ul>
      <TaxBreakdown result={entry.result} offer={entry.offer} {year} />
    </details>
  {/each}
</details>
