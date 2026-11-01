<script lang="ts">
import TimesIcon from "@primeicons/svelte/times";
import type { Snippet } from "svelte";
import type { Equation } from "../explanations/model.ts";
import { currentInspector } from "../inspector/context.ts";
import Hint from "../inspector/hint.svelte";
import EquationContent from "./equation-content.svelte";

let {
  label,
  equations,
  children,
  title = label,
  plain = false,
}: {
  label: string;
  equations: () => readonly Equation[];
  children?: Snippet;
  title?: string;
  plain?: boolean;
} = $props();
const inspector = currentInspector();
const id = $props.id();
let open = $state(false);
let selected = $state(0);
let trigger: HTMLButtonElement | undefined = $state();
let content = $derived.by(() => {
  if (open) {
    return equations();
  }
  return [];
});
const equation = $derived(content[selected]);
</script>

{#if inspector}
  <span>
    <button
      class="equation-trigger"
      class:plain
      class:structured={children !== undefined}
      type="button"
      aria-haspopup="dialog"
      aria-label={label}
      aria-current={inspector.active(trigger)}
      bind:this={trigger}
      onclick={(event) => inspector.open({ label: title, equations, trigger: event.currentTarget })}
    >
      {#if children}
        {@render children()}
      {:else}
        {label}
      {/if}
    </button>
  </span>
{:else}
  <button
    class="equation-trigger"
    class:structured={children !== undefined}
    type="button"
    popovertarget={id}
    aria-haspopup="dialog"
    aria-label={label}
    bind:this={trigger}
  >
    {#if children}
      {@render children()}
    {:else}
      {label}
    {/if}
  </button>
  <dialog
    {id}
    popover="auto"
    aria-label={`${label} equation`}
    ontoggle={(event) => {
      if (
        event.newState === "closed" &&
        (document.activeElement === document.body ||
          event.currentTarget.contains(document.activeElement))
      ) {
        trigger?.focus({ preventScroll: true });
      }
    }}
    onbeforetoggle={(event) => {
      open = event.newState === "open";
      if (open) {
        selected = 0;
      }
    }}
  >
    <div class="popup-heading">
      <strong>{label}</strong>
      <Hint
        icon={TimesIcon}
        label="Close"
        text="Close calculation details"
        onactivate={() => document.querySelector<HTMLElement>(`#${CSS.escape(id)}`)?.hidePopover()}
      />
    </div>
    {#if content.length > 1}
      <label class="offer-choice"
        >Offer
        <select bind:value={selected}>
          {#each content as item, index (index)}
            <option value={index}>{item.title}</option>
          {/each}
        </select>
      </label>
    {/if}
    {#if equation !== undefined}
      {#key selected}
        <EquationContent {equation} {id} />
      {/key}
    {/if}
  </dialog>
{/if}

<style>
.equation-trigger {
  display: inline;
  min-width: 0;
  min-height: 1.75rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: inherit;
  text-decoration: underline dotted;
  text-underline-offset: 0.2em;
}
.structured {
  width: 100%;
}
.plain {
  text-decoration: none;
}
.plain:hover {
  text-decoration: underline;
}
dialog {
  width: min(48rem, calc(100vw - 2rem));
  max-height: calc(100dvh - 2rem);
  margin: auto;
  padding: 1rem;
  border: 1px solid var(--line);
  background: var(--panel);
  color: var(--text);
  overflow: auto;
  text-align: left;
  font-weight: var(--weight-regular);
  white-space: normal;
  overflow-wrap: anywhere;
}
.popup-heading {
  position: sticky;
  top: -1rem;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  background: var(--panel);
  padding-block: 0.5rem;
  border-bottom: 1px solid var(--divider);
}
.popup-heading :global(button) {
  flex-shrink: 0;
  white-space: nowrap;
}
.offer-choice {
  display: grid;
  gap: 0.25rem;
  margin-top: 0.75rem;
  color: var(--muted);
}
</style>
