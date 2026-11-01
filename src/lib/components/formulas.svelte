<script lang="ts">
import CloneIcon from "@primeicons/svelte/clone";
import EraserIcon from "@primeicons/svelte/eraser";
import UndoIcon from "@primeicons/svelte/undo";
import { getContext } from "svelte";
import type { Fields, SalRecord } from "../data/model.d.ts";
import { type EditState, editContext } from "../edit-state.svelte.ts";
import { formulaVariable } from "../formulas/catalogue.ts";
import Hint from "../inspector/hint.svelte";
import ChoiceInput from "./choice-input.svelte";
import FieldFrame from "./field-frame.svelte";
import FormulaEditor from "./formula-editor.svelte";

let {
  records,
  offers,
  selectedId,
  disabled,
  profile,
  vehicle,
  initialComparison,
  scenariosById,
  onselect,
  oncreate,
  onduplicate,
  onchange,
  onscenario,
}: {
  records: SalRecord[];
  offers: SalRecord[];
  selectedId: string;
  disabled: boolean;
  profile: Fields;
  vehicle: Fields;
  initialComparison: string;
  scenariosById: Record<string, string>;
  onselect: (id: string) => Promise<void>;
  oncreate: () => Promise<void>;
  onduplicate: () => Promise<void>;
  onchange: (record: SalRecord) => Promise<string | null>;
  onscenario: (id: string, scenario: string) => void;
} = $props();
let filter = $state("");
let showArchived = $state(false);
const edits = getContext<EditState | undefined>(editContext);
const selected = $derived(
  records.find((record) => record.id === selectedId && record.kind === "formula"),
);
const formulas = $derived(
  records
    .filter((record) => record.kind === "formula")
    .toSorted((left, right) => left.name.localeCompare(right.name, "en-AU")),
);
const comparisons = $derived(records.filter((record) => record.kind === "comparison"));
const archiveAction = $derived.by(() => {
  if (selected?.archived) {
    return {
      icon: UndoIcon,
      label: "Restore formula",
      text: "Restore this archived formula to the library",
    };
  }
  return { icon: EraserIcon, label: "Archive formula", text: "Archive formula" };
});
</script>

<div class="formula-layout">
  <aside aria-label="Formula library">
    <button type="button" class="primary" {disabled} onclick={oncreate}>New formula</button>
    <FieldFrame id="formula-filter" label="Filter formulas"
      ><input id="formula-filter" type="search" bind:value={filter}></FieldFrame
    >
    <ChoiceInput
      type="checkbox"
      label="Show archived formulas"
      checked={showArchived}
      onchange={(checked) => {
        showArchived = checked;
      }}
    />
    {#each formulas.filter(
      (formula) =>
        (showArchived || !formula.archived || formula.id === selectedId) &&
        (formula.name || "Untitled formula").toLowerCase().includes(filter.trim().toLowerCase()),
    ) as formula (formula.id)}
      <button
        class="formula-choice"
        type="button"
        aria-pressed={selectedId === formula.id}
        onclick={() => onselect(formula.id)}
      >
        {formula.name || "Untitled formula"}
        {#if formula.archived}
          · archived
        {/if}
      </button>
    {/each}
  </aside>
  <section class="content" aria-label="Formula editor">
    {#if selected}
      <div class="formula-heading">
        <h2>{selected.name || "New formula"} <code>{formulaVariable(selected.name)}</code></h2>
        <div class="formula-actions">
          <Hint
            icon={CloneIcon}
            label="Duplicate formula"
            text="Duplicate formula"
            {disabled}
            onactivate={onduplicate}
          />
          {#key selected.archived}
            <Hint
              {...archiveAction}
              disabled={disabled || (edits?.pending.length ?? 0) > 0}
              onactivate={() => {
                if (selected) {
                  onchange({ ...selected, archived: !selected.archived });
                }
              }}
            />
          {/key}
        </div>
      </div>
      {#if selected.archived}
        <p class="hint">Archived formulas still calculate in comparisons that already use them.</p>
      {/if}
      {#key selected.id}
        <FormulaEditor
          record={selected}
          {formulas}
          {comparisons}
          {offers}
          {profile}
          {vehicle}
          {disabled}
          {onchange}
          {initialComparison}
          {scenariosById}
          {onscenario}
        />
      {/key}
    {:else}
      <h2>Formulas</h2>
      <p>
        Create a named calculation from comparison metrics and numbers. Preview each offer, then
        choose which saved comparisons show it.
      </p>
    {/if}
  </section>
</div>

<style>
.formula-layout {
  display: grid;
  grid-template-columns: 15rem minmax(0, 1fr);
  gap: 1rem;
  align-items: start;
}
.content {
  min-width: 0;
}
aside {
  display: grid;
  gap: 0.5rem;
  min-width: 0;
}
.formula-choice {
  text-align: left;
  overflow-wrap: anywhere;
}
.formula-choice[aria-pressed="true"] {
  border-color: var(--accent);
  background: var(--soft);
}
.formula-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.formula-actions {
  display: flex;
  gap: 0.25rem;
}
h2 code {
  color: var(--muted);
  font-family: var(--font-data);
  font-size: var(--text-small);
  font-weight: var(--weight-regular);
}
@media (width <= 48rem) {
  .formula-layout {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
