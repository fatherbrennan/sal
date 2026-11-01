<script lang="ts">
import type { ComparisonResult, Metric } from "../calculations/comparison.ts";
import { value } from "../calculations/inputs.ts";
import { overviewPayroll } from "../comparison-overview.ts";
import { payrollEquation, ruleDates } from "../explanations/payroll.ts";
import { taxValue } from "../explanations/tax.ts";
import { display } from "../format.ts";
import EquationPopup from "./equation-popup.svelte";

interface Entry {
  result: ComparisonResult;
  guaranteed: ComparisonResult | undefined;
  target: ComparisonResult | undefined;
  metrics: Metric[];
}
let {
  entries,
}: {
  entries: Entry[];
} = $props();
let payrolls = $derived(entries.map(({ result }) => overviewPayroll(result)));
</script>

<tbody class="overview-context">
  <tr>
    <th scope="row">
      Estimated payslip cash after deductions
      <small>Representative base pay · per pay period · before job costs</small>
    </th>
    {#each payrolls as context (context.result.offer.id)}
      <td>
        <span>Pay frequency: {context.payroll.period ?? "not entered"}</span>
        {#each context.payroll.rulePeriods as period (period.rulePeriod)}
          <div>
            <EquationPopup
              label={display(taxValue(period.bankEstimate))}
              equations={() => [
                payrollEquation("bankEstimate", period.bankEstimate, context, {
                  period: period.rulePeriod,
                }),
              ]}
              ><span
                class:numeric={taxValue(period.bankEstimate) !== null}
                data-calculator-value={(taxValue(period.bankEstimate) !== null &&
                  display(taxValue(period.bankEstimate))) ||
                  ""}
                data-calculator-label={`${context.result.offer.id}::period_bank_cash_estimate[${period.rulePeriod}]`}
                >{display(taxValue(period.bankEstimate))}</span
              ></EquationPopup
            >
            <small>{ruleDates[period.rulePeriod]}</small>
          </div>
        {/each}
        <small>Representative withholding; excludes bonus payments.</small>
      </td>
    {/each}
  </tr>
  <tr>
    <th scope="row">
      Offer conditions and fit<small>Entered facts and personal notes · no monetary score</small>
    </th>
    {#each entries as entry (entry.result.offer.id)}
      <td class="conditions">{value(entry.result.offer.fields, "terms") || "Not entered"}</td>
    {/each}
  </tr>
</tbody>

<style>
th,
td {
  border-bottom: 1px solid var(--divider);
  padding: 0.5rem 0.75rem;
  text-align: right;
  min-width: 12rem;
  vertical-align: top;
}
th {
  position: sticky;
  left: 0;
  z-index: 1;
  text-align: left;
  background: var(--panel);
  max-width: 17rem;
}
small,
td > span {
  display: block;
  color: var(--muted);
  font-size: var(--text-small);
  font-weight: var(--weight-regular);
}
td div + div {
  margin-top: 0.4rem;
}
.conditions {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
</style>
