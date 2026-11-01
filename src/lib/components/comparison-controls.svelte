<script lang="ts">
import { value } from "../calculations/inputs.ts";
import { scenarios } from "../comparison-scenarios.ts";
import type { SalRecord } from "../data/model.d.ts";
import { sections } from "../fields.ts";
import Combobox from "./combobox.svelte";
import FieldFrame from "./field-frame.svelte";
import FieldInput from "./field-input.svelte";

let {
  record,
  selected,
  disabled,
  scenario,
  onscenario,
  onchange,
}: {
  record: SalRecord;
  selected: SalRecord[];
  disabled: boolean;
  scenario: string;
  onscenario: (next: string) => void;
  onchange: (key: string, next: string) => Promise<string | null>;
} = $props();
const id = $props.id();
</script>

<div class="field-grid">
  <FieldFrame {id} label="Baseline offer">
    <select
      {id}
      value={selected.find((offer) => offer.id === value(record.fields, "baseline"))?.id ?? ""}
      {disabled}
      onchange={(event) => onchange("baseline", event.currentTarget.value)}
    >
      <option value="">Choose a baseline</option>
      {#each selected as offer (offer.id)}
        <option value={offer.id}>{offer.name || "Untitled offer"}</option>
      {/each}
    </select>
  </FieldFrame>
  {#each sections.comparison
    .flatMap((section) => section.fields)
    .filter((definition) => definition.key === "timeValue") as definition (definition.key)}
    <FieldInput
      {definition}
      value={value(record.fields, definition.key)}
      {disabled}
      onvalid={(next) => onchange(definition.key, next)}
    />
  {/each}
  <FieldFrame id={`${id}-scenario`} label="Earnings scenario">
    <Combobox
      inputId={`${id}-scenario`}
      label="Earnings scenario"
      placeholder="Search scenarios…"
      options={scenarios}
      selected={scenario}
      displaySelection
      onselect={onscenario}
    />
  </FieldFrame>
</div>

<style>
.field-grid {
  margin-block: 0.5rem;
}
</style>
