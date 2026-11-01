<script lang="ts">
import type { ComparisonResult, Metric } from "../calculations/comparison.ts";
import { metricAmount } from "../calculations/comparison-insights.ts";
import { difference, value } from "../calculations/inputs.ts";
import { comparisonLabel } from "../comparison-presentation.ts";
import { comparisonVariables } from "../explanations/comparison-reference.ts";
import {
  differenceEquation,
  percentageDifferenceEquation,
  percentageDifferenceValue,
} from "../explanations/difference.ts";
import type { Equation } from "../explanations/model.ts";
import { display } from "../format.ts";
import { differenceLabel } from "../result-presentation.ts";
import EquationPopup from "./equation-popup.svelte";

let {
  result,
  baseline,
  metric,
  displayName,
  explain,
  oninspect,
  active = false,
}: {
  result: ComparisonResult;
  baseline: ComparisonResult;
  metric: Metric;
  displayName?: string;
  explain: (result: ComparisonResult, label: string) => Equation;
  oninspect?: (element: HTMLElement) => void;
  active?: boolean;
} = $props();
let amount = $derived(metricAmount(result, metric.label));
let baselineAmount = $derived(metricAmount(baseline, metric.label));
let delta = $derived(difference(amount, baselineAmount));
let signedAmount = $derived.by(() => {
  let { unit } = metric;
  if (unit === "percent") {
    unit = "number";
  }
  const formatted = display(delta, unit);
  if (delta !== null && delta > 0) {
    return `+${formatted}`;
  }
  return formatted;
});
let calculatorLabel = $derived(
  `${result.offer.id},${baseline.offer.id}::${comparisonVariables.get(metric.label) ?? metric.label}`,
);
let percentageText = $derived.by(() => {
  const relativePercentage = percentageDifferenceValue(delta, baselineAmount);
  if (typeof relativePercentage === "string") {
    return "Percentage unavailable: baseline is zero";
  }
  return display(relativePercentage, "percent");
});
function equations(): Equation[] {
  const title = `${result.offer.name} compared with ${baseline.offer.name}: ${displayName ?? comparisonLabel(metric.label, value(result.payer, "employment"))}`;
  const sources = [explain(result, metric.label), explain(baseline, metric.label)];
  return [
    differenceEquation(title, amount, baselineAmount, sources),
    percentageDifferenceEquation(`Relative percentage: ${title}`, amount, baselineAmount, sources),
  ];
}
</script>

{#snippet values()}
  {#if delta === null}
    <span data-calculator-value="">Difference unavailable</span>
  {:else if delta === 0}
    <span>No change</span>
  {:else}
    <span class="delta-values" aria-hidden="true">
      <span
        class="numeric"
        data-inspector-value="difference_from_baseline"
        data-calculator-value={display(
          delta,
          (metric.unit === "percent" && "number") || metric.unit,
        )}
        data-calculator-label={`difference_from_baseline[${calculatorLabel}]`}
      >
        {signedAmount}
        {#if metric.unit === "percent"}
          pp
        {/if}
      </span>
      <span
        class:numeric={typeof percentageDifferenceValue(delta, baselineAmount) !== "string"}
        data-inspector-value="percentage_change"
        data-calculator-value={(typeof percentageDifferenceValue(delta, baselineAmount) !==
          "string" &&
          percentageText) ||
          ""}
        data-calculator-label={`percentage_change[${calculatorLabel}]`}
        title={percentageText}
        >{#if baselineAmount === 0}
          — (base 0)
        {:else}
          {percentageText}
        {/if}</span
      >
      <span>
        {#if delta > 0}
          ▲
        {:else if delta < 0}
          ▼
        {:else}
          ─
        {/if}
      </span>
    </span>
  {/if}
{/snippet}

<small
  class:better={metric.lowerIsBetter !== null &&
    delta !== null &&
    delta !== 0 &&
    delta < 0 === metric.lowerIsBetter}
  class:worse={metric.lowerIsBetter !== null &&
    delta !== null &&
    delta !== 0 &&
    delta > 0 === metric.lowerIsBetter}
>
  {#if oninspect}
    <button
      type="button"
      aria-current={active}
      aria-label={`Inspect difference: ${displayName ?? comparisonLabel(metric.label, value(result.payer, "employment"))} · ${result.offer.name} versus ${baseline.offer.name} · ${differenceLabel(delta, metric)} · ${percentageText} relative change`}
      onclick={(event) => oninspect(event.currentTarget)}
    >
      {@render values()}
    </button>
  {:else}
    <EquationPopup
      label={`${differenceLabel(delta, metric)} · ${percentageText} relative change`}
      {equations}
    >
      {@render values()}
    </EquationPopup>
  {/if}
</small>

<style>
small {
  display: block;
  color: var(--muted);
  font-size: var(--text-small);
  font-weight: var(--weight-regular);
}
.better {
  color: var(--success);
}
.delta-values {
  display: grid;
  grid-template-columns: minmax(max-content, 1fr) minmax(0, 10ch) 1em;
  gap: 0.75em;
  white-space: nowrap;
}
@container (width <= 48rem) {
  .delta-values {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 0.1rem 0.3rem;
  }
  .delta-values > span:nth-child(2) {
    grid-row: 2;
    grid-column: 1 / -1;
  }
}
.delta-values > span:nth-child(2) {
  white-space: normal;
  overflow-wrap: anywhere;
}
.delta-values > span {
  justify-self: end;
}
.worse {
  color: var(--danger);
}
button {
  width: 100%;
  min-height: 1.75rem;
  padding: 0.15rem 0;
  border: 0;
  color: inherit;
  font: inherit;
  text-align: right;
  background: transparent;
}
button:hover {
  text-decoration: underline;
  text-underline-offset: 0.2em;
}
</style>
