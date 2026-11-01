<script lang="ts">
import { onMount } from "svelte";
import type { CalculatorPlacement } from "../calculator-placement.svelte.ts";
import { type CalculatorPosition, calculatorPositions } from "../calculator-position.ts";
import { controlShortcuts } from "../control-shortcuts.ts";
import { trapModalTab } from "../keybindings.ts";
import ShortcutKeys from "./shortcut-keys.svelte";

let {
  placement,
  choosing,
  onchoose,
  oncancel,
}: {
  placement: CalculatorPlacement;
  choosing: boolean;
  onchoose: (position: CalculatorPosition) => void;
  oncancel: () => void;
} = $props();
let grid: HTMLFieldSetElement | undefined = $state();
let dialog: HTMLDialogElement | undefined = $state();
let hovered = $state<CalculatorPosition | null>(null);
const shortcuts = controlShortcuts();
const cancelBindings = $derived(shortcuts.bindings("shortcutPlacementCancel"));
let target = $derived.by(() => {
  if (placement.drag) {
    return placement.target;
  }
  return hovered ?? placement.anchor;
});
let landing = $derived(placement.pointFor(target));

function keydown(event: KeyboardEvent): void {
  event.stopPropagation();
  if (event.key === "Tab" && dialog) {
    trapModalTab(event, dialog);
  }
  if (shortcuts.match(event, ["shortcutPlacementCancel"])) {
    event.preventDefault();
    oncancel();
  }
}
onMount(() => {
  if (!choosing) {
    return;
  }
  const previous = document.activeElement;
  dialog?.showModal();
  grid?.querySelector<HTMLElement>('[aria-pressed="true"]')?.focus();
  return () => {
    dialog?.close();
    if (previous instanceof HTMLElement && previous.checkVisibility()) {
      previous.focus({ preventScroll: true });
    }
  };
});
</script>

{#snippet content()}
  <fieldset
    id="calculator-positions"
    class="snap-grid"
    aria-label="Calculator position"
    bind:this={grid}
  >
    {#each calculatorPositions as position (position.id)}
      <button
        type="button"
        class="snap-cell"
        aria-label={position.label}
        aria-pressed={placement.anchor.id === position.id}
        data-target={target.id === position.id}
        disabled={!choosing || placement.drag !== null}
        onpointerenter={() => {
          hovered = position;
        }}
        onfocus={() => {
          hovered = position;
        }}
        onkeydown={keydown}
        onclick={() => onchoose(position)}
      >
        <span>{position.icon} {position.label}</span>
      </button>
    {/each}
  </fieldset>
  <div
    class="landing-preview"
    aria-hidden="true"
    style:left={`${landing.x}px`}
    style:top={`${landing.y}px`}
    style:width={`${placement.panelWidth}px`}
    style:height={`${placement.panelHeight}px`}
  ></div>
  <div class="guide">
    <span role="status">Snap to {target.label.toLocaleLowerCase()}</span>
    {#if choosing}
      <button type="button" onclick={oncancel} onkeydown={keydown}>Cancel placement</button>
    {:else}
      <span>
        Release to place
        {#each cancelBindings as binding (binding)}
          · <ShortcutKeys value={binding} gesture="press" /> to cancel
        {/each}
      </span>
    {/if}
  </div>
{/snippet}

{#if choosing}
  <dialog
    bind:this={dialog}
    class="snap-overlay"
    aria-label="Place calculator"
    data-calculator
    oncancel={(event) => {
      event.preventDefault();
    }}
  >
    {@render content()}
  </dialog>
{:else}
  <div class="snap-overlay dragging" data-calculator>{@render content()}</div>
{/if}

<style>
.snap-overlay {
  position: fixed;
  inset: 0;
  width: auto;
  height: auto;
  max-width: none;
  max-height: none;
  padding: 0;
  margin: 0;
  border: 0;
  z-index: 110;
  background: color-mix(in srgb, var(--background) 18%, transparent);
  color: var(--text);
}
.snap-overlay::backdrop {
  background: transparent;
}
.dragging {
  z-index: 90;
  pointer-events: none;
}
.snap-grid {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-template-rows: repeat(3, minmax(0, 1fr));
  margin: 0;
  padding: 0;
  border: 0;
  min-width: 0;
}
.snap-cell {
  display: grid;
  place-items: center;
  min-width: 0;
  min-height: 0;
  margin: 0;
  padding: 0.25rem;
  border: 0;
  background: transparent;
}
.snap-cell:nth-child(n + 4) {
  border-top: 1px dashed color-mix(in srgb, var(--text) 28%, transparent);
}
.snap-cell:not(:nth-child(3n + 1)) {
  border-left: 1px dashed color-mix(in srgb, var(--text) 28%, transparent);
}
.snap-cell:disabled {
  opacity: 1;
}
.snap-cell span {
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--divider);
  background: var(--panel);
  color: var(--muted);
  font-size: var(--text-small);
}
.snap-cell[data-target="true"] {
  background: color-mix(in srgb, var(--accent) 6%, transparent);
}
.snap-cell[data-target="true"] span {
  border-color: var(--accent);
  color: var(--accent);
}
.landing-preview {
  position: fixed;
  border: 2px dashed var(--accent);
  background: color-mix(in srgb, var(--accent) 8%, transparent);
  pointer-events: none;
}
.guide {
  position: absolute;
  top: 0.5rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  max-width: calc(100% - 1rem);
  padding: 0.35rem 0.6rem;
  border: 1px solid var(--divider);
  background: var(--panel);
  font-size: var(--text-small);
}
@media (hover: none) and (pointer: coarse) {
  .snap-overlay {
    display: none;
  }
}
</style>
