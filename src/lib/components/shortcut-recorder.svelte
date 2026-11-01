<script lang="ts">
import { onMount } from "svelte";
import { trapModalTab } from "../keybindings.ts";
import { bindingError, displayStroke, strokeFromEvent } from "../shortcut-binding.ts";
import { bindingsFor, type ShortcutCommand } from "../shortcut-commands.ts";
import { sequenceHelp } from "../shortcut-sequence.ts";
import ShortcutKeys from "./shortcut-keys.svelte";

let {
  command,
  bindingIndex,
  fields,
  disabled,
  onsave,
  oncancel,
}: {
  command: ShortcutCommand;
  bindingIndex: number | null;
  fields: Record<string, string>;
  disabled: boolean;
  onsave: (binding: string) => Promise<boolean>;
  oncancel: () => void;
} = $props();
let dialog: HTMLDialogElement | undefined = $state();
let input: HTMLInputElement | undefined = $state();
let strokes = $state<string[]>([]);
let twoSteps = $state(false);
let failure = $state("");
const binding = $derived(strokes.join(" "));
const validation = $derived.by(() => {
  if (binding === "") {
    return null;
  }
  return bindingError(command, binding, fields, bindingIndex);
});
const complete = $derived(
  (twoSteps && strokes.length === 2) || (!twoSteps && strokes.length === 1),
);
onMount(() => {
  dialog?.showModal();
  input?.focus();
});

async function save(): Promise<void> {
  if (!complete || validation || disabled) {
    return;
  }
  if (!(await onsave(binding))) {
    failure = "Not saved. Close this editor to review the save error or conflict.";
  }
}
function recordKey(event: KeyboardEvent): void {
  if (event.key === "Tab") {
    return;
  }
  event.stopPropagation();
  event.preventDefault();
  if (event.repeat || event.isComposing || event.getModifierState("AltGraph")) {
    return;
  }
  const unmodified = !(event.ctrlKey || event.metaKey || event.altKey || event.shiftKey);
  if (event.key === "Escape" && unmodified) {
    oncancel();
    return;
  }
  if (event.key === "Enter" && unmodified) {
    save();
    return;
  }
  const stroke = strokeFromEvent(event);
  if (!stroke) {
    return;
  }
  failure = "";
  if (twoSteps && strokes.length === 1) {
    strokes = [...strokes, stroke];
  } else {
    strokes = [stroke];
  }
}
</script>

<dialog
  bind:this={dialog}
  data-calculator
  aria-labelledby="shortcut-title"
  onkeydown={(event) => {
    event.stopPropagation();
    if (event.key === "Tab" && dialog) {
      trapModalTab(event, dialog);
    }
  }}
  oncancel={(event) => {
    event.preventDefault();
    oncancel();
  }}
>
  <h3 id="shortcut-title">
    {#if bindingIndex === null}
      Add shortcut
    {:else}
      Change shortcut
    {/if}
  </h3>
  <p class="command">{command.action}</p>
  {#if bindingIndex !== null}
    <p>
      Current:
      <ShortcutKeys
        value={bindingsFor(fields, command)[bindingIndex] ?? ""}
        gesture={command.gesture}
      />
    </p>
  {/if}
  <label for="shortcut-record">Press your new key combination</label>
  <input
    id="shortcut-record"
    bind:this={input}
    readonly
    value={strokes.map(displayStroke).join(" then ")}
    placeholder="Press keys…"
    onkeydown={recordKey}
    aria-describedby="shortcut-record-help shortcut-record-result"
    aria-invalid={validation !== null}
  >
  <p id="shortcut-record-help">
    Enter saves; Escape cancels; Tab moves to the buttons. Browser or system shortcuts may not reach
    this recorder.
  </p>
  <label class="sequence"
    ><input
      type="checkbox"
      bind:checked={twoSteps}
      onchange={() => {
        strokes = [];
        input?.focus();
      }}
    >
    Two-step sequence</label
  >
  {#if command.gesture === "hold"}
    {#if twoSteps}
      <p>Hold the second combination while clicking a value.</p>
    {:else}
      <p>Hold this combination while clicking a value.</p>
    {/if}
  {:else if command.gesture === "double" && !twoSteps}
    <p>This combination is used for both steps. Use Reset to restore the original binding.</p>
  {/if}
  {#if twoSteps || command.gesture === "double"}
    <p>{sequenceHelp}</p>
  {/if}
  <p id="shortcut-record-result" role="status">
    {#if validation}
      {validation}
    {:else if complete}
      Available
    {:else}
      Waiting for keys…
    {/if}
  </p>
  {#if failure}
    <p role="alert">{failure}</p>
  {/if}
  <div class="actions">
    <button type="button" onclick={oncancel}>Cancel</button>
    <button type="button" disabled={disabled || !complete || validation !== null} onclick={save}>
      Save shortcut
    </button>
  </div>
</dialog>

<style>
dialog {
  width: min(34rem, calc(100vw - 2rem));
  max-height: calc(100dvh - 2rem);
  overflow: auto;
  padding: 1.25rem;
  border: 1px solid var(--line);
  background: var(--panel);
  color: var(--text);
}
dialog::backdrop {
  background: rgb(0 0 0 / 35%);
}
h3 {
  margin-top: 0;
}
.command {
  font-weight: var(--weight-medium);
}
input[readonly] {
  width: 100%;
  margin-top: 0.5rem;
  padding: 0.8rem;
  border-color: var(--accent);
}
p {
  overflow-wrap: anywhere;
}
.sequence,
.actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.actions {
  justify-content: flex-end;
  margin-top: 1rem;
  flex-wrap: wrap;
}
[role="alert"],
[aria-invalid="true"] {
  color: var(--danger);
}
</style>
