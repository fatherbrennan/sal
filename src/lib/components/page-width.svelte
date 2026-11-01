<script lang="ts">
import { onDestroy } from "svelte";
import { value } from "../calculations/inputs.ts";
import { controlShortcuts } from "../control-shortcuts.ts";
import { trapModalTab } from "../keybindings.ts";
import { pageWidthMaximum, pageWidthMinimum, pageWidthStep } from "../page-width.ts";
import type { Workspace } from "../workspace.svelte.ts";

let {
  workspace,
  disabled,
  preview = $bindable<string | null>(null),
}: {
  workspace: Workspace;
  disabled: boolean;
  preview: string | null;
} = $props();
let dialog: HTMLDialogElement | undefined = $state();
let slider: HTMLInputElement | undefined = $state();
let saving = $state(false);
const shortcuts = controlShortcuts();
let failure = $state("");
const saved = $derived(value(workspace.settings("preferences").fields, "pageWidth") || "100");
const current = $derived(preview ?? saved);

function open(): void {
  failure = "";
  dialog?.showModal();
  slider?.focus();
}
function close(): void {
  if (!saving) {
    dialog?.close();
    preview = null;
  }
}
async function save(): Promise<void> {
  if (saving) {
    return;
  }
  saving = true;
  failure = "";
  try {
    const preferences = workspace.settings("preferences");
    const pageWidth = current;
    if (
      !(await workspace.save([{ ...preferences, fields: { ...preferences.fields, pageWidth } }]))
    ) {
      failure =
        "Width not saved. Retry, or close to restore the saved width and review any conflict.";
      return;
    }
  } finally {
    saving = false;
  }
  if (current !== saved) {
    await save();
  }
}
onDestroy(() => {
  preview = null;
});
</script>

<div class="actions">
  <button type="button" {disabled} onclick={open}>Adjust page width</button>
  <span class="numeric">{saved}%</span>
</div>
<dialog
  bind:this={dialog}
  data-calculator
  aria-labelledby="page-width-title"
  onkeydown={(event) => {
    event.stopPropagation();
    if (event.key === "Tab" && dialog) {
      trapModalTab(event, dialog);
    }
    if (shortcuts.match(event, ["shortcutWidthClose"])) {
      close();
    }
  }}
  oncancel={(event) => {
    event.preventDefault();
  }}
>
  <h2 id="page-width-title">Page width</h2>
  <p id="page-width-help">Preview changes as you drag. Width saves when you release the slider.</p>
  <label for="page-width-slider">Screen width: <span class="numeric">{current}%</span></label>
  <input
    bind:this={slider}
    id="page-width-slider"
    type="range"
    min={pageWidthMinimum}
    max={pageWidthMaximum}
    step={pageWidthStep}
    value={current}
    disabled={!workspace.ready || workspace.conflict !== null}
    aria-label="Page width"
    aria-valuetext={`${current}% of screen width`}
    aria-describedby="page-width-help page-width-minimum"
    oninput={(event) => {
      preview = event.currentTarget.value;
    }}
    onchange={save}
  >
  <div class="limits"><span>20%</span><span>100%</span></div>
  <p id="page-width-minimum">Keeps at least 320px, or the full screen width on smaller screens.</p>
  <p role="status">
    {#if saving}
      Saving…
    {:else}
      Changes save automatically.
    {/if}
  </p>
  {#if failure}
    <p role="alert">{failure}</p>
    <button type="button" {disabled} onclick={save}>Retry saving width</button>
  {/if}
  <div class="actions">
    <button type="button" disabled={saving} onclick={close}>Close</button>
  </div>
</dialog>

<style>
dialog {
  position: fixed;
  inset: 0;
  margin: auto;
  width: min(32rem, calc(100vw - 2rem));
  max-height: calc(100dvh - 2rem);
  overflow: auto;
  padding: 1.25rem;
  border: 1px solid var(--line);
  background: var(--panel);
  color: var(--text);
}
dialog::backdrop {
  background: rgb(0 0 0 / 15%);
}
input {
  appearance: none;
  display: block;
  width: 100%;
  min-height: 2.25rem;
  margin: 0;
  background: transparent;
}
input::-webkit-slider-runnable-track {
  height: 0.25rem;
  background: var(--line);
}
input::-moz-range-track {
  height: 0.25rem;
  background: var(--line);
}
input::-webkit-slider-thumb {
  appearance: none;
  width: 1rem;
  height: 1rem;
  margin-top: -0.375rem;
  border: 1px solid var(--accent);
  border-radius: 0;
  background: var(--accent);
}
input::-moz-range-thumb {
  width: 1rem;
  height: 1rem;
  border: 1px solid var(--accent);
  border-radius: 0;
  background: var(--accent);
}
.limits {
  display: flex;
  justify-content: space-between;
}
dialog .actions {
  justify-content: flex-end;
  margin-bottom: 0;
}
[role="alert"] {
  color: var(--danger);
}
</style>
