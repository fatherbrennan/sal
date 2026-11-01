<script lang="ts">
import { calculateComparison } from "../calculations/comparison.ts";
import { rows, value } from "../calculations/inputs.ts";
import { scenarios } from "../comparison-scenarios.ts";
import type { Fields, SalRecord } from "../data/model.d.ts";
import { display } from "../format.ts";
import { formulaMetric } from "../formulas/results.ts";
import FieldFrame from "./field-frame.svelte";

let {
  formula,
  formulas,
  comparisons,
  offers,
  profile,
  vehicle,
  initialComparison,
  scenariosById,
  onscenario,
}: {
  formula: SalRecord;
  formulas: SalRecord[];
  comparisons: SalRecord[];
  offers: SalRecord[];
  profile: Fields;
  vehicle: Fields;
  initialComparison: string;
  scenariosById: Record<string, string>;
  onscenario: (id: string, scenario: string) => void;
} = $props();
let comparisonId = $state<string | null>(null);
const id = $props.id();
const comparison = $derived(
  comparisons.find((entry) => entry.id === (comparisonId ?? initialComparison)),
);
const scenario = $derived(
  scenarios.find((entry) => entry.id === (scenariosById[comparison?.id ?? ""] || "guaranteed")),
);
const year = $derived(value(comparison?.fields ?? {}, "year"));
const calculated = $derived.by(() => {
  if (!(comparison && scenario) || (year !== "2025-26" && year !== "2026-27")) {
    return [];
  }
  return rows(comparison, "offers").flatMap((item) => {
    const offer = offers.find((entry) => entry.id === value(item.fields, "offerId"));
    if (!offer) {
      return [];
    }
    const result = calculateComparison({
      offer,
      profile,
      vehicle,
      year,
      target: scenario.target,
      oneOff: scenario.oneOff,
      baseOnly: scenario.baseOnly,
      timeValue: value(comparison.fields, "timeValue") === "yes",
    });
    return [{ offer, result }];
  });
});
const results = $derived(
  calculated.map(({ offer, result }) => ({
    offer,
    metric: formulaMetric(formula, result.metrics, formulas),
  })),
);
</script>

<section aria-label="Formula preview">
  <h3>Live preview</h3>
  <div class="field-grid">
    <FieldFrame id={`${id}-comparison`} label="Preview comparison">
      <select
        id={`${id}-comparison`}
        value={comparison?.id ?? ""}
        onchange={(event) => {
          comparisonId = event.currentTarget.value;
        }}
      >
        <option value="">Choose a saved comparison</option>
        {#each comparisons as entry (entry.id)}
          <option value={entry.id}>{entry.name || "Untitled comparison"}</option>
        {/each}
      </select>
    </FieldFrame>
    {#if comparison && scenario}
      <FieldFrame id={`${id}-scenario`} label="Preview earnings scenario">
        <select
          id={`${id}-scenario`}
          value={scenario.id}
          onchange={(event) => {
            if (comparison) {
              onscenario(comparison.id, event.currentTarget.value);
            }
          }}
        >
          {#each scenarios as entry (entry.id)}
            <option value={entry.id}>{entry.label}</option>
          {/each}
        </select>
      </FieldFrame>
    {/if}
  </div>
  {#if comparison}
    <p class="hint">
      {year || "Financial year not selected"}
      · Commute time value:
      {#if value(comparison.fields, "timeValue") === "yes"}
        included
      {:else}
        not included
      {/if}
      . Preview uses the current expression; comparison rows use its saved version.
    </p>
  {/if}
  <div aria-live="polite" aria-atomic="true">
    {#if results.length}
      <table>
        <thead>
          <tr>
            <th scope="col">Offer</th>
            <th scope="col">{formula.name || "Formula result"}</th>
          </tr>
        </thead>
        <tbody>
          {#each results as { offer, metric } (offer.id)}
            <tr>
              <th scope="row">{offer.name || "Untitled offer"}</th>
              <td>
                <span class:numeric={metric.amount !== null}
                  >{display(metric.amount, metric.unit)}</span
                >
                {#if metric.reason}
                  <small>{metric.reason}</small>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {:else}
      <p>
        Choose a comparison with saved offers and a financial year to preview results. You can
        create formulas before adding offers.
      </p>
    {/if}
  </div>
</section>

<style>
section {
  margin-top: 1rem;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th,
td {
  padding: 0.5rem;
  border-bottom: 1px solid var(--divider);
  overflow-wrap: anywhere;
}
th {
  text-align: left;
}
td {
  text-align: right;
}
small {
  display: block;
  color: var(--muted);
}
</style>
