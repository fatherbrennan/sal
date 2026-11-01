<script lang="ts">
import { tick, untrack } from "svelte";
import { type ComparisonResult, calculateComparison } from "../calculations/comparison.ts";
import { comparisonInsights } from "../calculations/comparison-insights.ts";
import { rows, value } from "../calculations/inputs.ts";
import { isLeaveMetric, leaveReason } from "../calculations/leave-metrics.ts";
import type { TaxYear } from "../calculations/tax/types.d.ts";
import { cashAfterCosts, comparisonBasis } from "../comparison-overview.ts";
import {
  comparisonEmployment,
  comparisonGroups,
  comparisonLabel,
  leaveEditInput,
} from "../comparison-presentation.ts";
import { scenarios } from "../comparison-scenarios.ts";
import type { Fields, SalRecord } from "../data/model.d.ts";
import { comparisonEquation } from "../explanations/comparison.ts";
import { insightEquation } from "../explanations/comparison-insights.ts";
import { comparisonKey, comparisonVariables } from "../explanations/comparison-reference.ts";
import type { ComparisonReference, Equation } from "../explanations/model.ts";
import { field } from "../fields/helpers.ts";
import { sections } from "../fields.ts";
import { display } from "../format.ts";
import { formulaEquation } from "../formulas/equation.ts";
import { formulaMetric, selectedFormulas } from "../formulas/results.ts";
import InspectorWorkspace from "../inspector/workspace.svelte";
import { type MissingInput, missingInputs } from "../result-presentation.ts";
import ComparisonAverage from "./comparison-average.svelte";
import ComparisonBasis from "./comparison-basis.svelte";
import ComparisonContext from "./comparison-context.svelte";
import ComparisonControls from "./comparison-controls.svelte";
import ComparisonDifference from "./comparison-difference.svelte";
import ComparisonFormulaLabel from "./comparison-formula-label.svelte";
import ComparisonFormulas from "./comparison-formulas.svelte";
import ComparisonGroup from "./comparison-group.svelte";
import ComparisonMetricLabel from "./comparison-metric-label.svelte";
import ComparisonMissingOffers from "./comparison-missing-offers.svelte";
import ComparisonNavigation from "./comparison-navigation.svelte";
import ComparisonOffers, { offerLabel } from "./comparison-offers.svelte";
import ComparisonOneOffs from "./comparison-one-offs.svelte";
import ComparisonTable from "./comparison-table.svelte";
import ComparisonTaxDetails from "./comparison-tax-details.svelte";
import ComparisonTradeoff from "./comparison-tradeoff.svelte";
import EquationPopup from "./equation-popup.svelte";
import FieldInput from "./field-input.svelte";
import MetricReview from "./metric-review.svelte";

interface Props {
  record: SalRecord;
  formulas: SalRecord[];
  onformulas: () => void;
  scenario: string;
  onscenario: (scenario: string) => void;
  offers: SalRecord[];
  profile: Fields;
  vehicle: Fields;
  disabled: boolean;
  inspectorPinned: boolean;
  onpin: (pinned: boolean) => Promise<boolean>;
  onchange: (record: SalRecord) => Promise<string | null>;
  onresolve: (offerId: string, input: MissingInput, metric?: string) => void;
}
let {
  record,
  formulas,
  onformulas,
  scenario,
  onscenario,
  offers,
  profile,
  vehicle,
  disabled,
  inspectorPinned,
  onpin,
  onchange,
  onresolve,
}: Props = $props();
let expanded = $state<string[]>([]);
let activeFormula = $state("");
let reviewing = $state<{ offerId: string; label: string } | null>(null);
let setupOpen = $state(
  untrack(() => rows(record, "offers").length < 2 || !value(record.fields, "baseline")),
);
async function jumpTo(label: string): Promise<void> {
  const group = groups.find((entry) => entry.title === label || entry.labels.includes(label));
  if (!group) {
    return;
  }
  expanded = [...new Set([...expanded, group.title])];
  await tick();
  const target = document.querySelector<HTMLElement>(`[data-jump="${CSS.escape(label)}"]`);
  target?.scrollIntoView({ block: "center", inline: "nearest" });
  target?.focus({ preventScroll: true });
}
const selectId = $props.id();
function reveal(reference: ComparisonReference): boolean {
  const group = groups.find((entry) => entry.labels.includes(reference.metric));
  if (!(group && shown.some(({ result }) => comparisonKey(result) === reference.key))) {
    return false;
  }
  expanded = [...new Set([...expanded, group.title])];
  return true;
}
async function reviewOffer(id: string, label: string): Promise<void> {
  reviewing = { offerId: id, label };
  await tick();
  const heading = document.querySelector<HTMLElement>(`#${CSS.escape(`${selectId}-review`)}`);
  heading?.scrollIntoView({ block: "center" });
  heading?.focus({ preventScroll: true });
}
function financialYear(): TaxYear | null {
  const selectedYear = value(record.fields, "year");
  if (selectedYear === "2025-26" || selectedYear === "2026-27") {
    return selectedYear;
  }
  return null;
}
let year = $derived(financialYear());
let selectedIds = $derived(rows(record, "offers").map((item) => value(item.fields, "offerId")));
let selected = $derived(
  selectedIds
    .flatMap((id) => offers.filter((offer) => offer.id === id))
    .toSorted((left, right) => {
      const baselineId = value(record.fields, "baseline");
      return Number(right.id === baselineId) - Number(left.id === baselineId);
    }),
);
let calculations = $derived(calculateScenarios());
const customFormulas = $derived(selectedFormulas(record, formulas));
const customNames = $derived(
  Object.fromEntries(
    customFormulas.map((formula) => [`formula:${formula.id}`, formula.name || "Untitled formula"]),
  ),
);
function customFormula(label: string): SalRecord | undefined {
  return customFormulas.find((formula) => `formula:${formula.id}` === label);
}
function calculateScenarios() {
  const currentYear = year;
  if (currentYear === null) {
    return [];
  }
  return scenarios.map((entry) => ({
    ...entry,
    results: selected.map((offer) => {
      const result = calculateComparison({
        offer,
        profile,
        vehicle,
        year: currentYear,
        target: entry.target,
        oneOff: entry.oneOff,
        baseOnly: entry.baseOnly,
        timeValue: value(record.fields, "timeValue") === "yes",
      });
      result.metrics = [
        ...result.metrics,
        ...customFormulas.map((formula) => ({
          ...formulaMetric(formula, result.metrics, formulas),
          label: `formula:${formula.id}`,
        })),
      ];
      return { offer, result };
    }),
  }));
}
let shown = $derived(calculations.find((entry) => entry.id === scenario)?.results ?? []);
let reviewResult = $derived(shown.find((entry) => entry.offer.id === reviewing?.offerId)?.result);
let employment = $derived(comparisonEmployment(shown.map((entry) => entry.result)));
let groups = $derived.by(() => {
  const builtIn = comparisonGroups(
    shown.some((entry) => value(entry.offer.fields, "employment") === "sole-trader"),
  );
  const overviewGroups = 4;
  return [
    ...builtIn.slice(0, overviewGroups),
    { title: "Custom formulas", alwaysVisible: true, labels: Object.keys(customNames) },
    ...builtIn.slice(overviewGroups),
  ];
});
let missing = $derived(
  new Map(shown.map((entry) => [entry.offer.id, missingInputs(entry.result)])),
);
let baseline = $derived(shown.find((entry) => entry.offer.id === value(record.fields, "baseline")));
function scenarioResult(result: ComparisonResult, target: boolean): ComparisonResult | undefined {
  return calculations
    .find(
      (entry) =>
        !entry.baseOnly && entry.target === target && entry.oneOff === result.scenario.oneOff,
    )
    ?.results.find((entry) => entry.offer.id === result.offer.id)?.result;
}
let insights = $derived(
  shown.map(({ result }) => ({
    result,
    guaranteed: scenarioResult(result, false),
    target: scenarioResult(result, true),
    metrics: comparisonInsights(
      result,
      baseline?.result,
      scenarioResult(result, false),
      scenarioResult(result, true),
    ),
  })),
);
function change(key: string, next: string): Promise<string | null> {
  return onchange({ ...record, fields: { ...record.fields, [key]: next } });
}
function explainResult(result: ComparisonResult, label: string): Equation {
  const custom = customFormula(label);
  if (custom) {
    return formulaEquation(custom, result, explainResult, { formulas });
  }
  return comparisonEquation(
    label,
    {
      offer: result.offer,
      profile,
      vehicle,
      year: result.tax.withOffer.input.year,
      ...result.scenario,
      timeValue: value(record.fields, "timeValue") === "yes",
    },
    result,
  );
}
function groupInsights(title: string) {
  return (insights[0]?.metrics ?? []).filter((metric) => {
    const bonus = metric.label.includes("target") || metric.label.startsWith("Target");
    return bonus === (title === "Bonuses, commissions and one-offs");
  });
}
// Preference saves refresh record objects without changing the calculation inputs.
const inspectionRevision = $derived(
  JSON.stringify({
    selected,
    profile,
    vehicle,
    fields: record.fields,
    scenario,
    formulas,
    customFormulas,
  }),
);
</script>

{#snippet amountValue(amount: number | null, unit: "money" | "number" | "percent", source: string)}
  <span
    class="amount"
    class:numeric={amount !== null}
    data-calculator-value={(amount !== null && display(amount, unit)) || ""}
    data-calculator-label={source}
    >{display(amount, unit)}</span
  >
{/snippet}

{#snippet columns()}
  <colgroup>
    <col class="metric-column">
    <col span={shown.length}>
  </colgroup>
  <thead>
    <tr>
      <th scope="col">Metric</th>
      {#each shown as entry (entry.offer.id)}
        <th scope="col" class:baseline-column={baseline?.offer.id === entry.offer.id}>
          {entry.offer.name || "Untitled offer"}
          {#if baseline?.offer.id === entry.offer.id}
            <small class="baseline">Baseline</small>
          {/if}
          {#if value(entry.offer.fields, "employment") === "sole-trader"}
            <small>Contractor: cash rows are economic estimates</small>
          {/if}
        </th>
      {/each}
    </tr>
  </thead>
{/snippet}

<InspectorWorkspace revision={inspectionRevision} {reveal} {inspectorPinned} {onpin} {disabled}>
  <ComparisonMissingOffers {record} {offers} />
  <details class="comparison-setup" data-disclosure="Edit comparison" bind:open={setupOpen}>
    <summary>
      Edit comparison
      <span
        >{selected.length}
        offers</span
      >
    </summary>
    <div class="controls field-grid">
      <FieldInput
        definition={field("name", "Comparison name", "text")}
        value={record.name}
        {disabled}
        onvalid={(name) => onchange({ ...record, name })}
      />
      {#each sections.comparison
        .flatMap((section) => section.fields)
        .filter((definition) => definition.key === "year") as definition (definition.key)}
        <FieldInput
          {definition}
          value={value(record.fields, definition.key)}
          {disabled}
          onvalid={(next) => change(definition.key, next)}
        />
      {/each}
    </div>
    <ComparisonOffers {record} {offers} {disabled} {onchange} />
  </details>
  <ComparisonControls {record} {selected} {disabled} {scenario} {onscenario} onchange={change} />
  {#if year === null}
    <p>Choose a financial year before calculating this comparison.</p>
  {:else if shown.length === 0}
    <p>Select saved offers to compare.</p>
  {:else}
    <p class="comparison-title" id={`${selectId}-title`}>
      {year}
      · {scenarios.find((entry) => entry.id === scenario)?.label} · AUD estimates
    </p>
    {#if reviewing && reviewResult}
      <MetricReview
        id={`${selectId}-review`}
        result={reviewResult}
        label={reviewing.label}
        explain={explainResult}
        {onresolve}
        onclose={async () => {
          const label = reviewing?.label;
          reviewing = null;
          if (label) {
            await jumpTo(label);
          }
        }}
      />
    {/if}
    <ComparisonTable offerCount={shown.length}>
      {#snippet actions()}
        <ComparisonNavigation
          {groups}
          labels={customNames}
          {employment}
          baseline={baseline?.offer.name || "Not selected"}
          bind:expanded
          onjump={jumpTo}
        />
      {/snippet}
      {#snippet headings()}
        <table>
          {@render columns()}
        </table>
      {/snippet}
      <table aria-labelledby={`${selectId}-title`}>
        {@render columns()}
        {#each groups as group, groupIndex (group.title)}
          <tbody>
            <tr class="group-heading">
              <td class:collapsible={!group.alwaysVisible} colspan={shown.length + 1}>
                {#if group.title === "Custom formulas"}
                  <ComparisonFormulas
                    {record}
                    {formulas}
                    {disabled}
                    {onchange}
                    bind:active={activeFormula}
                    onmanage={onformulas}
                  />
                {:else}
                  <div data-jump={group.title} tabindex="-1">
                    <ComparisonGroup
                      title={group.title}
                      alwaysVisible={group.alwaysVisible}
                      controls={`${selectId}-group-${groupIndex}`}
                      bind:expanded
                    />
                  </div>
                {/if}
              </td>
            </tr>
          </tbody>
          <tbody
            id={`${selectId}-group-${groupIndex}`}
            hidden={!(group.alwaysVisible || expanded.includes(group.title))}
          >
            {#each group.labels as label (label)}
              {@const custom = customFormula(label)}
              {@const metric = shown[0]?.result.metrics.find((entry) => entry.label === label)}
              {#if metric}
                <tr
                  class:key-result={groupIndex === 0}
                  class:overview-result={group.alwaysVisible}
                  class:hourly-start={label === "Cash + super after tax per paid hour"}
                >
                  <th
                    scope="row"
                    aria-label={customNames[label] ?? comparisonLabel(metric.label, employment)}
                    data-jump={label}
                    tabindex="-1"
                  >
                    {#if custom}
                      <ComparisonFormulaLabel
                        formula={custom}
                        bind:active={activeFormula}
                        {disabled}
                      />
                    {:else}
                      <ComparisonMetricLabel {label} {employment} />
                    {/if}
                  </th>
                  {#each shown as entry (entry.offer.id)}
                    {@const amount =
                      entry.result.metrics.find((item) => item.label === label)?.amount ?? null}
                    {@const metricName =
                      customNames[label] ??
                      comparisonLabel(metric.label, value(entry.result.payer, "employment"))}
                    <td
                      data-comparison={comparisonKey(entry.result)}
                      data-metric={label}
                      class:baseline-column={baseline?.offer.id === entry.offer.id}
                    >
                      <EquationPopup
                        label={`Inspect ${metricName}: ${display(amount, metric.unit)} · ${offerLabel(entry.offer)}`}
                        title={metricName}
                        equations={() => [explainResult(entry.result, metric.label)]}
                        plain
                        >{@render amountValue(
                          amount,
                          metric.unit,
                          `${entry.offer.id}::${comparisonVariables.get(metric.label) ?? metric.label}`,
                        )}</EquationPopup
                      >
                      {#if label === "Commute cash cost / broader estimate"}
                        <small>{comparisonBasis(entry.result)[0]}</small>
                      {/if}
                      {#if !custom && metricName !== comparisonLabel(label, employment)}
                        <small>{metricName}</small>
                      {/if}
                      {#if amount === null && custom}
                        <small
                          >{formulaMetric(custom, entry.result.metrics, formulas).reason}</small
                        >
                      {:else if amount === null}
                        <button
                          class="unavailable"
                          type="button"
                          aria-label={`Review ${metricName} inputs · ${offerLabel(entry.offer)}`}
                          onclick={() => reviewOffer(entry.offer.id, label)}
                        >
                          {#if (missing.get(entry.offer.id)?.length ?? 0) > 0}
                            Review inputs
                          {:else}
                            See conditions
                          {/if}
                        </button>
                      {/if}
                      {#if amount === null && isLeaveMetric(label)}
                        <small>{leaveReason(entry.result, label)}</small>
                      {/if}
                      {#if baseline && baseline.offer.id !== entry.offer.id}
                        <ComparisonDifference
                          result={entry.result}
                          baseline={baseline.result}
                          {metric}
                          displayName={metricName}
                          explain={explainResult}
                        />
                      {/if}
                      {#if label === cashAfterCosts}
                        <ComparisonAverage
                          result={entry.result}
                          source={() => explainResult(entry.result, label)}
                        />
                      {/if}
                    </td>
                  {/each}
                </tr>
              {/if}
            {/each}
          </tbody>
          {#if expanded.includes(group.title)}
            {#if group.title === "Pay, super and package value"}
              <ComparisonContext entries={insights} />
            {/if}
            {#if group.title === "Work and commuting"}
              <ComparisonTradeoff entries={insights} baseline={baseline?.result} />
            {/if}
            {#if group.title === "Work and commuting" ||
              group.title === "Bonuses, commissions and one-offs"}
              <tbody>
                {#each groupInsights(group.title) as metric (metric.label)}
                  <tr>
                    <th scope="row">
                      {comparisonLabel(metric.label, employment)}
                    </th>
                    {#each insights as entry (entry.result.offer.id)}
                      {@const amount =
                        entry.metrics.find((item) => item.label === metric.label)?.amount ?? null}
                      {@const metricName = comparisonLabel(
                        metric.label,
                        value(entry.result.payer, "employment"),
                      )}
                      <td>
                        <EquationPopup
                          label={`Inspect ${metricName} · ${offerLabel(entry.result.offer)}`}
                          title={metricName}
                          plain
                          equations={() => [
                            insightEquation(
                              metric.label,
                              { ...entry, baseline: baseline?.result },
                              explainResult,
                            ),
                          ]}
                        >
                          {@render amountValue(
                            amount,
                            metric.unit,
                            `${entry.result.offer.id}::comparison_insight`,
                          )}
                        </EquationPopup>
                      </td>
                    {/each}
                  </tr>
                {/each}
              </tbody>
            {/if}
            {#if group.title === "Bonuses, commissions and one-offs"}
              <ComparisonOneOffs
                {shown}
                recurring={calculations.find(
                  (entry) =>
                    scenario.endsWith("-once") && entry.id === scenario.replace("-once", ""),
                )?.results ?? []}
                {profile}
                {vehicle}
                timeValue={value(record.fields, "timeValue") === "yes"}
              />
            {/if}
            {#if group.title === "Annual leave details"}
              <tbody>
                <tr>
                  <th scope="row">Balance date and leave inputs</th>
                  {#each shown as entry (entry.offer.id)}
                    <td>
                      {entry.result.leave.balanceDate ?? "No balance date entered"}
                      <button
                        type="button"
                        onclick={() => onresolve(entry.offer.id, leaveEditInput(entry.result))}
                      >
                        Edit leave inputs
                      </button>
                    </td>
                  {/each}
                </tr>
              </tbody>
            {/if}
            {#if group.title === "Tax estimates and assumptions"}
              <ComparisonBasis results={shown.map(({ result }) => result)} />
            {/if}
          {/if}
        {/each}
      </table>
    </ComparisonTable>
    <ComparisonTaxDetails
      open={expanded.includes("Tax estimates and assumptions")}
      {shown}
      {year}
      {selectId}
      {onresolve}
    />
  {/if}
</InspectorWorkspace>

<style>
.controls {
  margin-bottom: 1rem;
}
.baseline-column {
  background: color-mix(in srgb, var(--accent) 4%, var(--panel));
}
.comparison-setup {
  margin: 0;
  padding: 0;
  border: 0;
}
.comparison-setup summary {
  display: flex;
  gap: 0.5rem;
}
.comparison-setup summary span {
  display: inline;
  font-size: var(--text-small);
  font-weight: var(--weight-regular);
  color: var(--muted);
}
.unavailable {
  display: block;
  margin-left: auto;
  color: var(--muted);
  font-weight: var(--weight-regular);
  font-size: var(--text-small);
  border: 0;
  padding: 0;
  background: transparent;
  text-decoration: underline;
}
table {
  position: relative;
  border-collapse: separate;
  border-spacing: 0;
  width: 100%;
  min-width: calc(var(--metric-width) + var(--offer-count) * var(--offer-width));
  table-layout: fixed;
  font-variant-numeric: tabular-nums;
  overscroll-behavior: none;
  -webkit-overflow-scrolling: touch;
}
.metric-column {
  width: var(--metric-width);
}
thead {
  position: relative;
  z-index: 4;
}
th,
td {
  border-bottom: 1px solid var(--divider);
  padding: 0.4rem 0.6rem;
  text-align: right;
  vertical-align: top;
  overflow-wrap: anywhere;
}
th:first-child {
  position: sticky;
  left: 0;
  z-index: 1;
  text-align: left;
  background: var(--panel);
}
thead th {
  background: var(--soft);
}
.baseline {
  color: var(--accent);
  font-weight: var(--weight-medium);
}
small {
  display: block;
  color: var(--muted);
  font-size: var(--text-small);
  font-weight: var(--weight-regular);
}
.comparison-title {
  text-align: left;
  margin-bottom: 0;
  font-weight: var(--weight-medium);
}
@media (width <= 48rem) {
  th:first-child {
    min-width: 0;
  }
  th,
  td {
    padding: 0.4rem;
  }
}
.group-heading td {
  position: static;
  background: var(--soft);
  border-bottom-color: var(--background);
  text-align: left;
  padding-block: 0.4rem;
}
.group-heading .collapsible {
  padding: 0;
}
.key-result th,
.key-result td {
  border-block: 2px solid var(--accent);
  background: var(--soft);
}
.amount.numeric {
  white-space: nowrap;
}
.key-result .amount.numeric,
td[data-metric="Package value including hypothetical leave cash-out"] .amount.numeric {
  font-weight: var(--weight-medium);
  font-size: var(--text-section);
}
.hourly-start th,
.hourly-start td {
  border-top: 2px solid var(--divider);
}
tr:hover > th,
tr:hover > td,
tr:focus-within > th,
tr:focus-within > td {
  background: var(--soft);
}
</style>
