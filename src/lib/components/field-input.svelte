<script lang="ts">
import UndoIcon from "@primeicons/svelte/undo";
import { getContext, onDestroy, untrack } from "svelte";
import { fieldError } from "../data/validation.ts";
import { type EditState, editContext } from "../edit-state.svelte.ts";
import type { Field } from "../fields.ts";
import Hint from "../inspector/hint.svelte";
import FieldFrame from "./field-frame.svelte";

interface Props {
  definition: Field;
  value: string;
  disabled: boolean;
  onvalid: (value: string) => Promise<string | null>;
  source?: string;
  sharedValue?: string | undefined;
  oninherit?: () => Promise<string | null>;
  target?: string;
}
let {
  definition,
  value,
  disabled,
  onvalid,
  source = "",
  sharedValue,
  oninherit,
  target = definition.key,
}: Props = $props();
let text = $state("");
let validationMessage = $state<string | null>(null);
let saving = $state(false);
let editing = $state(false);
const edits = getContext<EditState | undefined>(editContext);
const id = $props.id();
const helpId = `${id}-help`;
let hasSupport = $derived(
  Boolean(source || definition.type === "date" || definition.help || validationMessage),
);
let describedBy = $derived.by(() => {
  if (hasSupport) {
    return helpId;
  }
  return null;
});
let inputMode = $derived<"text" | "decimal">(mode());
function mode(): "text" | "decimal" {
  if (definition.type === "decimal") {
    return "decimal";
  }
  return "text";
}
$effect(() => {
  if (validationMessage === null && !saving && !editing) {
    text = value;
  }
});
$effect(() => {
  const dirty = text !== value;
  const invalid = validationMessage !== null;
  const { label } = definition;
  untrack(() => edits?.update(id, label, dirty, invalid));
});
onDestroy(() => edits?.remove(id));
async function change(next: string): Promise<void> {
  saving = true;
  text = next;
  validationMessage = fieldError(definition, next);
  if (validationMessage === null) {
    validationMessage = await onvalid(next);
  }
  saving = false;
  editing = validationMessage !== null;
}
function revert(): void {
  text = value;
  validationMessage = null;
  editing = false;
}
async function inherit(): Promise<void> {
  if (oninherit !== undefined) {
    saving = true;
    validationMessage = await oninherit();
    editing = validationMessage !== null;
    saving = false;
  }
}
</script>

<FieldFrame {id} {target} label={definition.label}>
  {#if definition.type === "select"}
    <select
      {id}
      value={text}
      {disabled}
      aria-invalid={validationMessage !== null}
      aria-describedby={describedBy}
      onchange={(event) => change(event.currentTarget.value)}
    >
      <option value="">Not entered</option>
      {#each definition.options as option (option.value)}
        <option value={option.value}>{option.label}</option>
      {/each}
    </select>
  {:else}
    <input
      {id}
      type="text"
      class:numeric={definition.type === "decimal" ||
        definition.type === "date" ||
        definition.key === "start" ||
        definition.key === "breakStart"}
      value={text}
      {disabled}
      inputmode={inputMode}
      data-calculator-value={(definition.type === "decimal" && text) || ""}
      data-calculator-label={target}
      aria-invalid={validationMessage !== null}
      aria-describedby={describedBy}
      oninput={(event) => {
        text = event.currentTarget.value;
        editing = true;
      }}
      onchange={(event) => change(event.currentTarget.value)}
    >
  {/if}
  {#snippet support()}
    {#if hasSupport}
      <small id={helpId}>
        {#if source}
          <span>{source}.</span>
          {#if source === "Offer override"}
            {#if sharedValue !== undefined}
              <span
                >Shared:
                <span
                  class:numeric={Boolean(sharedValue) &&
                    (definition.type === "decimal" || definition.type === "date")}
                  >{definition.options.find((option) => option.value === sharedValue)?.label ||
                    sharedValue ||
                    "Not entered"}</span
                >.</span
              >
            {/if}
            <Hint
              icon={UndoIcon}
              compact
              label="Use shared default"
              text={`Reset ${definition.label} to its shared default`}
              {disabled}
              onactivate={inherit}
            />
          {/if}
        {/if}
        {#if definition.type === "date"}
          Use YYYY-MM-DD.
        {/if}
        {definition.help}
        {#if validationMessage}
          <span role="alert">{validationMessage} The last saved value is unchanged.</span>
          <Hint
            icon={UndoIcon}
            compact
            label="Revert field"
            text={`Revert ${definition.label} to its last saved value`}
            onactivate={revert}
          />
        {/if}
      </small>
    {/if}
  {/snippet}
</FieldFrame>

<style>
small {
  color: var(--muted);
  overflow-wrap: anywhere;
  line-height: var(--leading-body);
  padding-top: 0.15rem;
}
[role="alert"] {
  display: block;
  color: var(--danger);
}
</style>
