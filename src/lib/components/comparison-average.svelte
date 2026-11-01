<script lang="ts">
import type { ComparisonResult } from "../calculations/comparison.ts";
import { metricAmount } from "../calculations/comparison-insights.ts";
import { value } from "../calculations/inputs.ts";
import { monthlyCash, monthlyCashEquation } from "../comparison-overview.ts";
import type { Equation } from "../explanations/model.ts";
import { display } from "../format.ts";
import EquationPopup from "./equation-popup.svelte";

let { result, source }: { result: ComparisonResult; source: () => Equation } = $props();
</script>

{#if value(result.payer, "costMethod") === "ato" &&
  metricAmount(result, "Return commute journeys") !== 0}
  <div class="monthly-average">Broader ATO cost estimate · not cash spending</div>
{/if}
{#if !result.scenario.oneOff}
  <div class="monthly-average">
    <EquationPopup
      label={`${display(monthlyCash(result))} / month average`}
      equations={() => [monthlyCashEquation(result, source())]}
      ><span
        class:numeric={monthlyCash(result) !== null}
        data-calculator-value={(monthlyCash(result) !== null && display(monthlyCash(result))) || ""}
        data-calculator-label={`${result.offer.id}::average_monthly_cash_after_job_costs`}
        >{display(monthlyCash(result))}</span
      >
      / month average</EquationPopup
    >
    <span>Annual estimate ÷ 12 · not a payslip</span>
  </div>
{/if}

<style>
.monthly-average {
  margin-top: 0.25rem;
  color: var(--muted);
  font-size: var(--text-small);
  font-weight: var(--weight-regular);
}
.monthly-average > span {
  display: block;
}
</style>
