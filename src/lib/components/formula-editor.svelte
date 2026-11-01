<script lang="ts">
import UndoIcon from "@primeicons/svelte/undo";
import { getContext, onDestroy, tick, untrack } from "svelte";
import { rows, value } from "../calculations/inputs.ts";
import type { Fields, SalRecord } from "../data/model.d.ts";
import { type EditState, editContext } from "../edit-state.svelte.ts";
import { formulaSections } from "../fields/formula.ts";
import { field } from "../fields/helpers.ts";
import { formulaOptions, readableFormula } from "../formulas/catalogue.ts";
import { formulaError, parseFormula } from "../formulas/parser.ts";
import Hint from "../inspector/hint.svelte";
import Combobox from "./combobox.svelte";
import FieldFrame from "./field-frame.svelte";
import FieldInput from "./field-input.svelte";
import FormulaPreview from "./formula-preview.svelte";

let {
  record,
  formulas,
  comparisons,
  offers,
  profile,
  vehicle,
  disabled,
  onchange,
  initialComparison,
  scenariosById,
  onscenario,
}: {
  record: SalRecord;
  formulas: SalRecord[];
  comparisons: SalRecord[];
  offers: SalRecord[];
  profile: Fields;
  vehicle: Fields;
  disabled: boolean;
  onchange: (record: SalRecord) => Promise<string | null>;
  initialComparison: string;
  scenariosById: Record<string, string>;
  onscenario: (id: string, scenario: string) => void;
} = $props();
const id = $props.id();
const edits = getContext<EditState | undefined>(editContext);
let text = $state("");
let editing = $state(false);
let saving = $state(false);
let saveError = $state<string | null>(null);
let input: HTMLTextAreaElement | undefined = $state();
let selection = { start: 0, end: 0 };
const options = $derived(formulaOptions(formulas.filter((entry) => entry.id !== record.id)));
const savedText = $derived(readableFormula(value(record.fields, "expression"), formulas));
const validationMessage = $derived(formulaError(text, formulas) ?? saveError);
const dirty = $derived(text !== savedText);
const usedBy = $derived(
  comparisons.filter((entry) =>
    rows(entry, "formulas").some((item) => value(item.fields, "formulaId") === record.id),
  ),
);
const draft = $derived({ ...record, fields: { ...record.fields, expression: text } });
$effect(() => {
  if (!(editing || saving) && saveError === null) {
    text = savedText;
  }
});
$effect(() => {
  const pending = dirty;
  const invalid = validationMessage !== null;
  untrack(() => edits?.update(`${id}-expression`, "Formula expression", pending, invalid));
});
onDestroy(() => edits?.remove(`${id}-expression`));

async function save(next: EventTarget | null = null): Promise<void> {
  if (!dirty || formulaError(text, formulas) !== null || saving || disabled) {
    return;
  }
  saving = true;
  const advanceFocus = next instanceof HTMLElement && next.id === `${id}-revert`;
  let expression = "";
  if (text.trim()) {
    expression = parseFormula(text, formulas).source;
  }
  saveError = await onchange({ ...record, fields: { ...record.fields, expression } });
  saving = false;
  if (saveError === null) {
    text = readableFormula(expression, formulas);
    editing = false;
    await tick();
    if (advanceFocus && document.activeElement === document.body) {
      document.querySelector<HTMLElement>(`#${CSS.escape(`${id}-metric`)}`)?.focus();
    }
  }
}
function rememberSelection(): void {
  if (input) {
    selection = { start: input.selectionStart, end: input.selectionEnd };
  }
}
async function insert(snippet: string): Promise<void> {
  const start = Math.min(selection.start, text.length);
  const end = Math.min(selection.end, text.length);
  text = `${text.slice(0, start)}${snippet}${text.slice(end)}`;
  editing = true;
  saveError = null;
  selection = { start: start + snippet.length, end: start + snippet.length };
  await tick();
  input?.focus();
  input?.setSelectionRange(selection.start, selection.end);
}
</script>

<div class="field-grid">
  <FieldInput
    definition={field("name", "Formula name", "text")}
    value={record.name}
    {disabled}
    onvalid={(name) => onchange({ ...record, name })}
  />
  {#each formulaSections
    .flatMap((section) => section.fields)
    .filter((entry) => entry.key !== "expression") as definition (definition.key)}
    <FieldInput
      {definition}
      value={record.fields[definition.key] ?? ""}
      {disabled}
      onvalid={(next) =>
        onchange({ ...record, fields: { ...record.fields, [definition.key]: next } })}
    />
  {/each}
</div>
<p class="hint">
  Used in {usedBy.length} saved comparisons
  {#if usedBy.length > 0}
    : {usedBy.map((entry) => entry.name || "Untitled comparison").join(", ")}
  {/if}
  . Saved changes update every linked comparison.
</p>
<FieldFrame id={`${id}-expression`} label="Expression" target="expression">
  <textarea
    id={`${id}-expression`}
    bind:this={input}
    value={text}
    rows="3"
    placeholder="annual_cash_after_tax / standard_paid_hours_per_year"
    spellcheck="false"
    disabled={disabled || saving}
    aria-invalid={validationMessage !== null}
    aria-describedby={`${id}-help`}
    onselect={rememberSelection}
    onblur={(event) => {
      if (
        !(event.relatedTarget instanceof Element && event.relatedTarget.closest(".builder-tools"))
      ) {
        save(event.relatedTarget);
      }
    }}
    oninput={(event) => {
      text = event.currentTarget.value;
      editing = true;
      saveError = null;
      rememberSelection();
    }}
  ></textarea>
  {#snippet support()}
    <div id={`${id}-help`} class="expression-help">
      {#if validationMessage}
        <p role="alert">{validationMessage} The saved formula is unchanged.</p>
      {/if}
      {#if dirty || saveError}
        <Hint
          id={`${id}-revert`}
          icon={UndoIcon}
          compact
          label="Revert expression"
          text="Revert expression to its last saved value"
          onactivate={() => {
            text = savedText;
            editing = false;
            saveError = null;
            input?.focus();
          }}
        />
      {/if}
    </div>
  {/snippet}
</FieldFrame>
<div
  class="builder-tools"
  onfocusout={(event) => {
    const next = event.relatedTarget;
    if (!(next instanceof Node && (event.currentTarget.contains(next) || next === input))) {
      save();
    }
  }}
>
  <FieldFrame id={`${id}-metric`} label="Insert metric">
    <Combobox
      inputId={`${id}-metric`}
      label="Insert metric"
      placeholder="Search metrics or variable names…"
      {options}
      selected=""
      {disabled}
      onselect={async (key) => {
        const metric = options.find((entry) => entry.id === key);
        if (metric) {
          await insert(metric.keywords);
        }
      }}
    >
      {#snippet optionDetail(option)}
        <small class="variable-name"><code>{option.keywords}</code></small>
      {/snippet}
    </Combobox>
  </FieldFrame>
  <fieldset class="operators" aria-label="Formula operators">
    {#each ["+", "-", "*", "/", "(", ")"] as operator (operator)}
      <button type="button" {disabled} onclick={() => insert(` ${operator} `)}>{operator}</button>
    {/each}
  </fieldset>
</div>
<details class="function-help">
  <summary>Functions and syntax</summary>
  <dl>
    <dt><code>IF(condition, when_true, when_false)</code></dt>
    <dd>Use =, !=, &lt;&gt;, &lt;, &lt;=, &gt; or &gt;=. Only the chosen branch is calculated.</dd>
    <dt><code>MIN(value, …)</code> · <code>MAX(value, …)</code></dt>
    <dd>Smallest or largest value.</dd>
    <dt><code>ABS(value)</code></dt>
    <dd>Absolute value.</dd>
    <dt><code>ROUND(value, places)</code></dt>
    <dd>Decimal places from −12 to 12; halfway values round away from zero.</dd>
  </dl>
  <p>
    Use parentheses for grouping. Enter 25% or 0.25 for a percentage. Percentage metrics are
    fractions; Percentage format displays 0.25 as 25%. Missing values stay unavailable. Result
    format does not check whether the units make sense together.
  </p>
  <p>Example: <code>annual_cash_after_tax / standard_paid_hours_per_year</code></p>
</details>
<FormulaPreview
  formula={draft}
  {formulas}
  {comparisons}
  {offers}
  {profile}
  {vehicle}
  {initialComparison}
  {scenariosById}
  {onscenario}
/>

<style>
textarea {
  width: 100%;
  min-height: 4.5rem;
  font-family: var(--font-data);
  line-height: var(--leading-compact);
}
@supports (resize: vertical) {
  textarea {
    resize: vertical;
  }
}
.variable-name {
  color: var(--muted);
}
.expression-help [role="alert"] {
  color: var(--danger);
}
.builder-tools {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
  margin-block: 0.5rem;
}
.builder-tools > :global(.field) {
  flex: 1 1 20rem;
}
.operators {
  border: 0;
  padding: 0;
  margin: 0;
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
}
.operators button {
  min-width: 2.25rem;
}
dd {
  margin: 0 0 0.5rem;
  color: var(--muted);
}
dt {
  overflow-wrap: anywhere;
}
</style>
