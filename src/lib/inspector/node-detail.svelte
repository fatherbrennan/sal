<script lang="ts">
import AngleDoubleRight from "@primeicons/svelte/angle-double-right";
import { calculatorDisplayValue } from "../format.ts";
import Formula from "./formula.svelte";
import { type Inspection, type InspectorNode, nodeAt, nodeValue } from "./model.ts";
import { kindLabels } from "./types.ts";

let {
  model,
  node,
  parent,
  scenario,
  onselect,
}: {
  model: Inspection;
  node: InspectorNode;
  parent?: InspectorNode | null | undefined;
  scenario?: string | undefined;
  onselect: (id: string) => void;
} = $props();
</script>

<article>
  <div class="eyebrow">
    {kindLabels[node.kind]}
  </div>
  <h3 tabindex="-1" data-node-heading>
    <span class="name">{node.label}</span>
    <code class="selected-code">{node.symbol}</code>
  </h3>
  <p
    class="amount"
    class:numeric={node.amount !== null && node.kind !== "collection"}
    class:unknown={nodeValue(node).startsWith("Unavailable")}
    data-calculator-value={(node.amount !== null &&
      node.kind !== "collection" &&
      calculatorDisplayValue(nodeValue(node))) ||
      ""}
    data-calculator-label={node.symbol}
  >
    {nodeValue(node)}
  </p>
  {#if node.description !== "Calculated from the equations below in this context."}
    <p>{node.description}</p>
  {/if}
  {#if nodeValue(node) === "Formula only"}
    <p class="precision">
      This step has no separately reported value. Its formula and inputs are shown below.
    </p>
  {/if}
  {#if nodeValue(node) === "Unavailable"}
    <p class="notice">
      This value is unavailable. See the calculation context and source below; unknown values are
      never replaced with zero.
    </p>
  {/if}
  {#if parent?.terms.some((term) => term.id === node.id)}
    <section class="parent" aria-label="Position in the previous calculation">
      <h4>Where this fits</h4>
      <Formula {model} node={parent} selected={node.id} {onselect} />
    </section>
  {/if}
  {#if node.terms.length > 0 || node.formula?.length}
    <section aria-label="Calculation breakdown">
      <h4>
        {#if node.kind === "collection"}
          Items in this collection
        {:else}
          Calculation used here
        {/if}
      </h4>
      {#if node.method}
        <p class="method">{node.method}</p>
      {/if}
      <Formula {model} {node} selected={node.id} {onselect} />
      <section class="inputs" aria-label="Calculation inputs">
        {#each node.terms as term, index (`${term.id}-${index}`)}
          {@const input = nodeAt(model, term.id)}
          <button type="button" onclick={() => onselect(input.id)}>
            <span class="input-label"
              >{input.label}<small><code>{input.symbol}</code></small></span
            >
            <span
              class:numeric={input.amount !== null && input.kind !== "collection"}
              data-calculator-value={(input.amount !== null &&
                input.kind !== "collection" &&
                calculatorDisplayValue(nodeValue(input))) ||
                ""}
              data-calculator-label={input.symbol}
              >{nodeValue(input)}</span
            >
            <span class="icon" aria-hidden="true">
              <AngleDoubleRight />
            </span>
          </button>
        {/each}
      </section>
      <p class="precision">
        {#if node.formula?.length}
          Select a value to inspect it. Use the equation for operation order and conditions.
        {:else}
          Select an item to inspect its value and source.
        {/if}
      </p>
      <p class="precision">
        Displayed amounts are rounded. Calculations retain full intermediate precision.
      </p>
    </section>
  {:else if node.kind === "collection"}
    <div class="empty">
      <strong>No items in this collection</strong>
      <p>
        {#if node.amount === 0}
          Zero is established: there are no selected items to add.
        {:else}
          The collection's value is not established.
        {/if}
      </p>
    </div>
  {:else}
    <div class="terminal">
      <strong
        >{#if node.kind === "input"}
          Source input reached
        {:else}
          Rule or calculator result reached
        {/if}</strong
      >
      <p>
        {#if node.kind === "input"}
          This is an entered value. It has no further formula to expand.
        {:else}
          This value comes from the source identified below. No further child calculation is
          supplied.
        {/if}
      </p>
    </div>
  {/if}
  {#if node.related?.length}
    <section class="inputs" aria-label="Related calculations">
      {#each node.related as id (id)}
        {@const related = nodeAt(model, id)}
        <button type="button" onclick={() => onselect(id)}>
          <code>{related.symbol}</code>
          <span
            class:numeric={related.amount !== null && related.kind !== "collection"}
            data-calculator-value={(related.amount !== null &&
              related.kind !== "collection" &&
              calculatorDisplayValue(nodeValue(related))) ||
              ""}
            data-calculator-label={related.symbol}
            >{nodeValue(related)}</span
          >
          <span class="icon" aria-hidden="true">
            <AngleDoubleRight />
          </span>
        </button>
      {/each}
    </section>
  {/if}
  <section class="source" aria-label="Value source">
    <h4>Source</h4>
    <p>{node.source}</p>
    {#if node.amount !== null}
      <details>
        <summary>Exact value</summary>
        <p class="raw">
          Unrounded value:
          <code
            data-calculator-value={String(node.amount)}
            data-calculator-label={`${node.symbol}[unrounded]`}
            >{node.amount}</code
          >
        </p>
      </details>
    {/if}
  </section>
  {#if scenario}
    <details>
      <summary>Scenario context</summary>
      {scenario}
    </details>
  {/if}
  {#if node.alternative}
    <details>
      <summary>Other method · not used here</summary>
      <p>{node.alternative}</p>
    </details>
  {/if}
  {#if node.notes?.length}
    <details>
      <summary>Context and assumptions</summary>
      {#each node.notes as note, index (index)}
        <p>{note}</p>
      {/each}
    </details>
  {/if}
</article>

<style>
article {
  min-width: 0;
}
.eyebrow {
  color: var(--muted);
  text-transform: uppercase;
  font-size: var(--text-small);
  letter-spacing: var(--tracking-eyebrow);
}
h3 {
  display: flex;
  flex-direction: column;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.25rem 0.5rem;
  margin: 0.3rem 0;
  font-size: var(--text-body);
  line-height: var(--leading-compact);
}
.name {
  overflow-wrap: anywhere;
}
.selected-code {
  font-size: var(--text-small);
  font-weight: var(--weight-regular);
  color: var(--muted);
}
.amount {
  margin: 0.3rem 0;
  font-size: var(--text-body);
  overflow-wrap: anywhere;
}
.amount.numeric {
  font-size: var(--text-section);
  font-weight: var(--weight-medium);
  line-height: var(--leading-heading);
  font-variant-numeric: tabular-nums;
  color: var(--equation-value);
}
p {
  margin-block: 0.3rem 0.4rem;
}
h4 {
  margin-block: 0.6rem 0.3rem;
  font-size: var(--text-body);
}
.unknown {
  color: var(--danger);
}
.notice {
  border-left: 3px solid var(--danger);
  padding: 0.65rem;
  background: var(--soft);
}
.parent {
  margin-top: 0.8rem;
}
.method {
  color: var(--muted);
  font-size: var(--text-small);
}
.inputs {
  margin-top: 0.4rem;
}
.inputs button {
  font-weight: var(--weight-regular);
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
  gap: 0.35rem;
  width: 100%;
  border: 0;
  border-bottom: 1px solid var(--divider);
  padding: 0.3rem;
  align-items: baseline;
  text-align: left;
}
.input-label {
  display: grid;
  min-width: 0;
}
.inputs .numeric {
  text-align: right;
  overflow-wrap: anywhere;
}
.icon {
  align-self: start;
  padding-top: 0.15em;
}
code {
  font-size: inherit;
  overflow-wrap: anywhere;
}
small {
  display: block;
  color: var(--muted);
  font-weight: var(--weight-regular);
  font-size: var(--text-variable);
}
.precision,
.raw {
  color: var(--muted);
  font-size: var(--text-small);
}
.empty,
.terminal {
  padding: 0.65rem;
  margin-top: 0.65rem;
  background: var(--soft);
  border-left: 3px solid var(--accent);
}
.empty p,
.terminal p {
  margin-bottom: 0;
}
.source {
  border-top: 1px solid var(--divider);
  margin-top: 0.65rem;
}
.source p {
  overflow-wrap: anywhere;
}
details {
  border: 1px solid var(--divider);
  padding: 0.5rem;
}
</style>
