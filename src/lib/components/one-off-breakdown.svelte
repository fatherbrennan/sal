<script lang="ts">
import type { ComparisonInput, ComparisonResult } from "../calculations/comparison.ts";
import { difference, rows, value } from "../calculations/inputs.ts";
import type { SalRecord } from "../data/model.d.ts";
import { numeric } from "../data/numeric.ts";
import { oneOffEquation } from "../explanations/one-off.ts";
import { display } from "../format.ts";
import EquationPopup from "./equation-popup.svelte";

let {
  offer,
  recurring,
  combined,
  input,
}: {
  offer: SalRecord;
  recurring: ComparisonResult;
  combined: ComparisonResult;
  input: ComparisonInput;
} = $props();
const label = "Cash after tax and job costs";
let netDifference = $derived(
  difference(
    combined.metrics.find((metric) => metric.label === label)?.amount ?? null,
    recurring.metrics.find((metric) => metric.label === label)?.amount ?? null,
  ),
);
</script>

<h4>One-off payments and costs</h4>
<ul>
  {#each rows(offer, "earnings").filter(
    (item) => value(item.fields, "recurrence") === "once",
  ) as item (item.id)}
    <li>
      {value(item.fields, "label") || "Payment"}:
      <span
        class:numeric={numeric(item.fields, "amount") !== null}
        data-calculator-value={(numeric(item.fields, "amount") !== null &&
          display(numeric(item.fields, "amount"))) ||
          ""}
        data-calculator-label={`${offer.id}::earnings[${item.id}].amount`}
        >{display(numeric(item.fields, "amount"))}</span
      >
      · {value(item.fields, "inclusion") || "Unspecified"} super ·
      {value(item.fields, "certainty") || "Unspecified certainty"}
    </li>
  {/each}
  {#each rows(offer, "costs").filter(
    (item) => value(item.fields, "recurrence") === "once",
  ) as item (item.id)}
    <li>
      {value(item.fields, "label") || "Cost"}:
      <span
        class:numeric={numeric(item.fields, "amount") !== null}
        data-calculator-value={(numeric(item.fields, "amount") !== null &&
          display(numeric(item.fields, "amount"))) ||
          ""}
        data-calculator-label={`${offer.id}::costs[${item.id}].amount`}
        >{display(numeric(item.fields, "amount"))}</span
      >
      · reimbursement
      <span
        class:numeric={numeric(item.fields, "reimbursement") !== null}
        data-calculator-value={(numeric(item.fields, "reimbursement") !== null &&
          display(numeric(item.fields, "reimbursement"))) ||
          ""}
        data-calculator-label={`${offer.id}::costs[${item.id}].reimbursement`}
        >{display(numeric(item.fields, "reimbursement"))}</span
      >
    </li>
  {/each}
</ul>
<p>
  <EquationPopup
    label="One-off change in cash after tax and job costs"
    equations={() => [oneOffEquation(recurring, combined, input)]}
  />:
  <strong
    class:numeric={netDifference !== null}
    data-calculator-value={(netDifference !== null && display(netDifference)) || ""}
    data-calculator-label={`${offer.id}::one_off_cash_change`}
    >{display(netDifference)}</strong
  >.
</p>
<p>
  Uses the selected guaranteed or target scenario. Tax is recalculated jointly; per-item tax amounts
  are not added together.
</p>
