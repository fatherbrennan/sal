<script lang="ts">
import AngleDoubleLeft from "@primeicons/svelte/angle-double-left";
import { tick } from "svelte";
import { type Equation, type EquationSection, equationValues } from "../explanations/model.ts";
import { equationGraph, resolveVariable, scopePath } from "../explanations/navigation.ts";
import {
  displayValue,
  equationSections,
  formulaValues,
  primaryFormula,
  readableFormula,
} from "../explanations/presentation.ts";
import { calculatorDisplayValue } from "../format.ts";
import Hint from "../inspector/hint.svelte";
import EquationFormula from "./equation-formula.svelte";

let { equation, id }: { equation: Equation; id: string } = $props();
interface Visit {
  scope: string;
  name: string;
  trigger: string;
  scroll: number;
}
let visits = $state<Visit[]>([]);
let heading: HTMLHeadingElement | undefined = $state();
const graph = $derived(equationGraph(equation));
const current = $derived(visits.at(-1));
const target = $derived.by(() => {
  if (current === undefined) {
    return null;
  }
  return resolveVariable(graph, current.scope, current.name);
});
const primary = $derived(primaryFormula(equation));
const values = $derived(formulaValues(primary, equation.values));
const { displayed_result: displayedResult } = $derived(equation.values);
function canExplain(scope: string, name: string): boolean {
  return resolveVariable(graph, scope, name) !== null;
}
async function navigate(scope: string, name: string, trigger: HTMLButtonElement): Promise<void> {
  const destination = resolveVariable(graph, scope, name);
  if (destination === null) {
    return;
  }
  const existing = visits.findIndex(
    (visit) => visit.scope === destination.scope && visit.name === destination.name,
  );
  if (existing >= 0) {
    visits = visits.slice(0, existing + 1);
  } else {
    visits = [
      ...visits,
      {
        scope: destination.scope,
        name: destination.name,
        trigger: trigger.id,
        scroll: trigger.closest("dialog")?.scrollTop ?? 0,
      },
    ];
  }
  await tick();
  heading?.focus();
  heading?.scrollIntoView({ block: "start" });
}
async function back(): Promise<void> {
  const previous = visits.at(-1);
  visits = visits.slice(0, -1);
  await tick();
  if (previous !== undefined) {
    const trigger = document.querySelector<HTMLButtonElement>(`#${CSS.escape(previous.trigger)}`);
    trigger?.focus({ preventScroll: true });
    const dialog = trigger?.closest("dialog");
    if (dialog !== null && dialog !== undefined) {
      dialog.scrollTop = previous.scroll;
    }
  }
}
</script>

{#snippet detail(section: EquationSection, parent: string, key: string)}
  {@const scope = scopePath(parent, section.scope ?? "")}
  <details>
    <summary>{section.title}</summary>
    <EquationFormula
      formula={section.formula}
      contextPath={scope}
      prefix={`${id}-${key}`}
      {canExplain}
      onvariable={navigate}
    />
    {#if section.values !== undefined}
      <EquationFormula
        formula={equationValues(section.values)}
        contextPath={scope}
        prefix={`${id}-${key}-values`}
        {canExplain}
        onvariable={navigate}
      />
    {/if}
    {#each section.notes ?? [] as note, index (index)}
      <p class="context">{note}</p>
    {/each}
    {#each section.sections ?? [] as child, index (index)}
      {@render detail(child, scope, `${key}-${index}`)}
    {/each}
  </details>
{/snippet}

{#if target !== null}
  <nav aria-label="Equation trail">
    <Hint icon={AngleDoubleLeft} label="Back" text="Back one step" onactivate={back} />
    <span>{visits.map((visit) => visit.name).join(" / ")}</span>
  </nav>
  <section aria-label="Variable definition" data-calculator-context={equation.title}>
    <h3 bind:this={heading} tabindex="-1">{target.name}</h3>
    <p class="context">
      {equation.title}
      {#if target.title !== equation.title}
        · {target.title}
      {/if}
    </p>
    <p class="context">{target.origin}</p>
    {#each target.members as member, index (index)}
      <p>
        <button
          id={`${id}-member-${visits.length}-${index}`}
          type="button"
          aria-label={`Explain ${member.name}`}
          onclick={(event) => navigate(member.scope, member.name, event.currentTarget)}
        >
          {graph.scopes.get(member.scope)?.title ?? member.scope}
          · {member.name}
        </button>
      </p>
    {/each}
    {#if target.value !== undefined}
      <p
        class="result"
        class:numeric={typeof target.value === "number"}
        data-calculator-value={(typeof target.value === "number" &&
          calculatorDisplayValue(displayValue(target.value, target.unit))) ||
          ""}
        data-calculator-label={target.name}
      >
        {displayValue(target.value, target.unit)}
      </p>
    {/if}
    {#each target.blocks as block (block.id)}
      <h4>{block.title}</h4>
      <EquationFormula
        formula={block.formula}
        contextPath={block.scope}
        prefix={`${id}-visit-${visits.length}-${block.id}`}
        {canExplain}
        onvariable={navigate}
      />
      {#each block.notes as note, index (index)}
        <p class="context">{note}</p>
      {/each}
    {/each}
  </section>
{/if}
<section hidden={target !== null} data-calculator-context={equation.title}>
  <h3>{equation.title}</h3>
  {#if equation.context}
    <p class="context">{equation.context}</p>
  {/if}
  {#if equation.result !== undefined}
    <p
      class="result"
      class:numeric={typeof equation.result.value === "number"}
      data-calculator-value={(typeof equation.result.value === "number" &&
        calculatorDisplayValue(displayValue(equation.result.value, equation.result.unit))) ||
        ""}
      data-calculator-label={equation.result.name}
    >
      {displayValue(equation.result.value, equation.result.unit)}
    </p>
  {:else if Object.hasOwn(equation.values, "displayed_result")}
    <p
      class="result"
      class:numeric={typeof displayedResult === "number"}
      data-calculator-value={(typeof displayedResult === "number" &&
        calculatorDisplayValue(displayValue(displayedResult))) ||
        ""}
      data-calculator-label="displayed_result"
    >
      {displayValue(displayedResult ?? null)}
    </p>
  {/if}
  {#each equation.warnings ??
    equation.notes.filter((note) => note.startsWith("Unavailable")) as note, index (index)}
    <p class="warning">{note}</p>
  {/each}
  <div class="plain-equation">
    <h4>How this is calculated</h4>
    <p>{readableFormula(equation)}</p>
    <p class="substitution">{readableFormula(equation, true)}</p>
    {#if readableFormula(equation, true).includes("≈")}
      <p class="context">
        Displayed values are rounded. The calculation retains intermediate precision.
      </p>
    {/if}
  </div>
  <details class="technical">
    <summary>Exact equation and sources</summary>
    <section>
      <h4>Main equation</h4>
      <EquationFormula formula={primary} prefix={`${id}-main`} {canExplain} onvariable={navigate} />
      {#if Object.keys(values).length > 0}
        <dl class="values" aria-label="Equation values">
          {#each Object.entries(values) as [name, amount] (name)}
            <div>
              <dt>
                {#if canExplain("", name)}
                  <button
                    id={`${id}-value-${name}`}
                    type="button"
                    onclick={(event) => navigate("", name, event.currentTarget)}
                  >
                    <code>{name}</code>
                  </button>
                {:else}
                  <code>{name}</code>
                {/if}
              </dt>
              <dd
                class:numeric={typeof amount === "number"}
                data-calculator-value={(typeof amount === "number" &&
                  calculatorDisplayValue(displayValue(amount, equation.units?.[name]))) ||
                  ""}
                data-calculator-label={name}
              >
                {displayValue(amount, equation.units?.[name])}
              </dd>
            </div>
          {/each}
        </dl>
      {/if}
      {#each equationSections(equation) as section, index (index)}
        {@render detail(section, "", `section-${index}`)}
      {/each}
      <details>
        <summary>Inputs and sources</summary>
        <p class="context">
          Exact calculation values are shown below. Summary rounding does not change the
          calculation. Amounts are AUD unless another unit is named. Unknown is not zero.
        </p>
        <EquationFormula
          formula={equationValues(equation.values)}
          prefix={`${id}-inputs`}
          {canExplain}
          onvariable={navigate}
        />
        {#each [...new Set(equation.notes)] as note, index (index)}
          <p class="context">{note}</p>
        {/each}
      </details>
    </section>
  </details>
</section>

<style>
h3 {
  margin-bottom: 0.25rem;
}
.plain-equation {
  background: var(--soft);
  padding: 0.6rem 0.75rem;
  margin-block: 0.75rem;
}
.plain-equation p {
  white-space: pre-line;
  margin-block: 0.35rem;
}
.substitution {
  font-variant-numeric: tabular-nums;
  font-weight: var(--weight-medium);
}
h4 {
  color: var(--accent);
  margin-block: 0.75rem 0.25rem;
}
.context {
  color: var(--muted);
  margin-block: 0.35rem;
  white-space: pre-line;
}
.result {
  margin-block: 0.5rem;
  overflow-wrap: anywhere;
}
.result.numeric {
  font-size: var(--text-title);
  font-weight: var(--weight-medium);
  line-height: var(--leading-heading);
  font-variant-numeric: tabular-nums;
}
.warning {
  border-left: 3px solid var(--danger);
  padding-left: 0.65rem;
  color: var(--danger);
}
.values {
  margin-block: 0.5rem 1rem;
}
.values div {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.2rem 1rem;
  padding-block: 0.2rem;
  border-bottom: 1px solid var(--divider);
}
dt {
  color: var(--accent);
  font-size: var(--text-body);
}
dt button {
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  min-height: 1.5rem;
  text-decoration: underline dotted;
  overflow-wrap: anywhere;
  text-align: left;
}
dd {
  margin: 0;
  color: var(--equation-value);
  font-weight: var(--weight-medium);
  font-variant-numeric: tabular-nums;
}
details {
  margin-block: 0.5rem;
  border: 1px solid var(--divider);
  padding: 0.5rem 0.65rem;
  background: var(--panel);
}
summary {
  color: var(--accent);
  font-weight: var(--weight-medium);
  cursor: pointer;
}
details[open] > summary {
  margin-bottom: 0.5rem;
}
nav {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  margin-block: 0.75rem;
}
nav > span {
  color: var(--muted);
  font-size: var(--text-small);
  min-width: 0;
}
nav :global(button) {
  flex-shrink: 0;
  white-space: nowrap;
}
h3[tabindex] {
  scroll-margin-top: 4rem;
}
</style>
