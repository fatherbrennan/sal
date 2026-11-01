<script lang="ts">
import TimesIcon from "@primeicons/svelte/times";
import UndoIcon from "@primeicons/svelte/undo";
import { onMount } from "svelte";
import {
  type Calculation,
  type CalculatorNumber,
  calculate,
  formatCalculatorValue,
  numericValue,
  type Operator,
  zeroCalculatorValue,
} from "../calculator.ts";
import { CalculatorPlacement, previewGap } from "../calculator-placement.svelte.ts";
import type { CalculatorState } from "../calculator-position.ts";
import { clickedValue, editing, type PickedValue } from "../calculator-value.ts";
import { controlShortcuts } from "../control-shortcuts.ts";
import Hint, { dismissHints } from "../inspector/hint.svelte";
import { dialogOwnsKeys } from "../keybindings.ts";
import { matchesStroke, strokeFromEvent } from "../shortcut-binding.ts";
import { bindingsFor, shortcutCommands, shortcutStrokes } from "../shortcut-commands.ts";
import { isSequencePrefix, ShortcutSequence } from "../shortcut-sequence.ts";
import { watchSequence } from "../shortcut-sequence-events.ts";
import CalculatorSnapGrid from "./calculator-snap-grid.svelte";

let {
  shortcuts,
  layout = $bindable(),
}: {
  shortcuts: Record<string, string>;
  layout: CalculatorState;
} = $props();
let history = $state<(Calculation & { source: string })[]>([]);
let held = $state<{ code: string; key: string; binding: string; operator: Operator } | null>(null);
let open = $state(false);
let problem = $state("");
let operand = $state("");
let operator = $state<Operator>("+");
let panel: HTMLElement | undefined = $state();
let positionsOpen = $state(false);
let previewHeight = $state(0);
const placement = new CalculatorPlacement(
  () => layout.position,
  (position) => {
    layout = { ...layout, position };
  },
);
let total = $derived(history.at(-1)?.result ?? zeroCalculatorValue);
let preview = $state<PickedValue | null>(null);
let highlighter: HTMLDivElement | undefined = $state();
let point: { x: number; y: number } | null = null;
let previewFrame: number | undefined;
const sequence = new ShortcutSequence();
const controls = controlShortcuts();

function placementKey(event: KeyboardEvent): void {
  if ((placement.drag || positionsOpen) && controls.match(event, ["shortcutPlacementCancel"])) {
    event.preventDefault();
    event.stopPropagation();
    placement.cancel();
    positionsOpen = false;
  }
}
function entryKey(event: KeyboardEvent): void {
  const { target } = event;
  if (controls.match(event, ["shortcutCalculatorApply"])) {
    manual(event);
  } else if (target instanceof HTMLInputElement && event.key === "Enter") {
    event.preventDefault();
  }
}
function apply(value: CalculatorNumber, operation: Operator, source: string): void {
  const result = calculate(total, operation, value);
  if (typeof result === "string") {
    problem = result;
    open = true;
    return;
  }
  history = [...history, { ...result, source }];
  problem = "";
  sequence.reset();
}
function undo(): void {
  history = history.slice(0, -1);
  problem = "";
}
function clear(): void {
  history = [];
  operand = "";
  problem = "";
}
function manual(event: Event): void {
  event.preventDefault();
  const value = numericValue(operand);
  if (value === null) {
    problem = "Enter a valid number.";
  } else {
    apply(value, operator, "Manual entry");
  }
}
function resetKeys(): void {
  held = null;
  preview = null;
  sequence.reset();
}
function focused(event: FocusEvent): void {
  if (editing(event.target)) {
    resetKeys();
  }
}
function keydown(event: KeyboardEvent): void {
  if (event.repeat || ["Control", "Meta", "Alt", "Shift"].includes(event.key)) {
    return;
  }
  if (
    (event.defaultPrevented && !isSequencePrefix(event)) ||
    positionsOpen ||
    placement.drag !== null ||
    event.isComposing ||
    event.getModifierState("AltGraph") ||
    !(layout.visible && panel?.checkVisibility())
  ) {
    resetKeys();
    return;
  }
  sequenceKey(event);
}
function sequenceKey(event: KeyboardEvent): void {
  held = null;
  preview = null;
  const textInput = editing(event.target);
  const modified = event.ctrlKey || event.metaKey || event.altKey;
  const bindings = shortcutCommands
    .filter((command) => command.group === "Calculator")
    .filter(
      (command) =>
        command.gesture === "hold" ||
        (!(textInput || dialogOwnsKeys()) &&
          (history.length > 0 ||
            (command.id === "shortcutClear" && (operand !== "" || problem !== "")))),
    )
    .flatMap((command) =>
      bindingsFor(shortcuts, command).map((binding) => ({
        id: command.id,
        strokes: shortcutStrokes(binding, command.gesture),
      })),
    )
    .filter(({ strokes }) => strokes.length === 1 || !textInput || modified);
  const next = sequence.next(event, bindings);
  if (!next) {
    return;
  }
  if (!textInput || modified) {
    event.preventDefault();
  }
  if (next.complete) {
    const command = shortcutCommands.find((entry) => entry.id === next.id);
    if (command?.gesture === "hold") {
      held = {
        code: event.code,
        key: event.key,
        binding: strokeFromEvent(event) ?? "",
        operator: command.operator,
      };
      refreshPreview();
    } else if (next.id === "shortcutUndo") {
      undo();
    } else {
      clear();
    }
  }
}
function keyup(event: KeyboardEvent): void {
  if (event.code === held?.code) {
    held = null;
    preview = null;
  }
}
function intercept(event: MouseEvent): void {
  if (
    held === null ||
    !layout.visible ||
    event.button !== 0 ||
    !matchesStroke(
      {
        key: held.key,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        altKey: event.altKey,
        shiftKey: event.shiftKey,
        isComposing: false,
      },
      held.binding,
    )
  ) {
    return;
  }
  const value = clickedValue(event);
  if (value !== null) {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (event.type === "click") {
      apply(value.value, held.operator, value.source);
    }
  }
}
function refreshPreview(): void {
  if (held && point && panel?.checkVisibility()) {
    preview = clickedValue({
      target: document.elementFromPoint(point.x, point.y),
      clientX: point.x,
      clientY: point.y,
    });
  } else {
    preview = null;
  }
}
function moved(event: PointerEvent): void {
  point = { x: event.clientX, y: event.clientY };
  if (
    panel?.checkVisibility() &&
    event.target instanceof Node &&
    !panel.contains(event.target) &&
    point.x >= placement.left &&
    point.x <= placement.left + placement.panelWidth &&
    point.y >= placement.top &&
    point.y <= placement.top + placement.panelHeight
  ) {
    dismissHints();
  }
  if (held && previewFrame === undefined) {
    previewFrame = requestAnimationFrame(() => {
      previewFrame = undefined;
      refreshPreview();
    });
  }
}
function left(event: PointerEvent): void {
  if (event.relatedTarget === null) {
    point = null;
    preview = null;
  }
}
$effect(() => {
  placement.previewSpace = (held && previewHeight + previewGap) || 0;
});
$effect(() => {
  if (!layout.visible) {
    resetKeys();
    placement.cancel();
  }
});
$effect(() => {
  if (held) {
    if (!highlighter?.matches(":popover-open")) {
      highlighter?.showPopover();
    }
  } else {
    highlighter?.hidePopover();
  }
});
onMount(() => {
  const stopWatching = watchSequence(sequence);
  const stopPositioning = placement.watchViewport();
  globalThis.addEventListener("pointermove", moved, true);
  globalThis.addEventListener("pointerout", left, true);
  globalThis.addEventListener("scroll", refreshPreview, true);
  globalThis.addEventListener("resize", refreshPreview);
  globalThis.addEventListener("keydown", keydown);
  globalThis.addEventListener("keyup", keyup, true);
  globalThis.addEventListener("pointerdown", intercept, true);
  globalThis.addEventListener("click", intercept, true);
  globalThis.addEventListener("blur", resetKeys);
  globalThis.addEventListener("blur", placement.cancel);
  document.addEventListener("visibilitychange", resetKeys);
  document.addEventListener("focusin", focused);
  return () => {
    stopWatching();
    stopPositioning();
    if (previewFrame !== undefined) {
      cancelAnimationFrame(previewFrame);
    }
    globalThis.removeEventListener("pointermove", moved, true);
    globalThis.removeEventListener("pointerout", left, true);
    globalThis.removeEventListener("scroll", refreshPreview, true);
    globalThis.removeEventListener("resize", refreshPreview);
    globalThis.removeEventListener("keydown", keydown);
    globalThis.removeEventListener("keyup", keyup, true);
    globalThis.removeEventListener("pointerdown", intercept, true);
    globalThis.removeEventListener("click", intercept, true);
    globalThis.removeEventListener("blur", resetKeys);
    globalThis.removeEventListener("blur", placement.cancel);
    document.removeEventListener("visibilitychange", resetKeys);
    document.removeEventListener("focusin", focused);
  };
});
</script>

<svelte:window bind:innerHeight={placement.viewportHeight} />

{#snippet number(value: CalculatorNumber)}
  {@const formatted = formatCalculatorValue(value)}
  {#if formatted.rounded}
    <span role="img" aria-label="Approximately">≈ </span>
  {/if}
  {formatted.text}
{/snippet}

<div class="highlight-layer" bind:this={highlighter} popover="manual" data-calculator>
  {#if held}
    <p
      class="preview"
      aria-live="polite"
      bind:offsetHeight={previewHeight}
      style:left={`${placement.left}px`}
      style:top={`${placement.previewTop}px`}
    >
      {#if preview}
        <span class="preview-hint">Click to apply</span>
        <span class="preview-value numeric">
          <span class="preview-operator">{held.operator}</span>
          <span>{@render number(preview.value)}</span>
        </span>
        <span class="preview-source">
          <span class="preview-hint">Source</span>
          <code>{preview.source}</code>
        </span>
      {:else}
        Point to a number to {held.operator}.
      {/if}
    </p>
  {/if}
  {#if preview && held}
    {#each preview.rectangles as rect, index (index)}
      <span
        class="highlight"
        aria-hidden="true"
        style:left={`${rect.left}px`}
        style:top={`${rect.top}px`}
        style:width={`${rect.width}px`}
        style:height={`${rect.height}px`}
      ></span>
    {/each}
  {/if}
</div>
<aside
  id="quick-calculator"
  hidden={!layout.visible}
  bind:this={panel}
  bind:offsetHeight={placement.panelHeight}
  bind:offsetWidth={placement.panelWidth}
  style:left={`${placement.left}px`}
  style:top={`${placement.top}px`}
  style:--preview-space={`${(held && previewHeight) || 0}px`}
  data-calculator
  aria-label="Quick calculator"
  class:active={held !== null}
>
  <div class="panel-heading">
    <button
      type="button"
      class="move"
      aria-label="Move calculator"
      aria-expanded={positionsOpen}
      aria-controls="calculator-positions"
      title="Drag to move, or click to choose a position"
      onpointerdown={(event) => {
        resetKeys();
        placement.start(event);
      }}
      onpointermove={(event) => placement.move(event)}
      onpointerup={(event) => placement.finish(event)}
      onpointercancel={placement.cancel}
      onlostpointercapture={placement.cancel}
      onkeydown={placementKey}
      onclick={() => {
        if (!placement.dragged) {
          positionsOpen = !positionsOpen;
        }
        placement.dragged = false;
      }}
    >
      <span aria-hidden="true">⠿</span>
    </button>
    <button
      class="total"
      type="button"
      aria-label="Calculator"
      aria-expanded={open}
      aria-controls="calculator-details"
      onclick={() => {
        open = !open;
      }}
    >
      <span>Calculator {held?.operator ?? ""}</span>
      <output class="numeric" aria-label="Calculator total" aria-live="polite"
        >{@render number(total)}</output
      >
      <span aria-hidden="true"
        >{#if open}
          ▾
        {:else}
          ▴
        {/if}</span
      >
    </button>
    <Hint
      icon={TimesIcon}
      label="Hide calculator"
      text="Hide calculator"
      onactivate={() => {
        layout = { ...layout, visible: false };
        document.querySelector<HTMLElement>("#calculator-toggle")?.focus();
      }}
    />
  </div>
  <div id="calculator-details" hidden={!open}>
    <p>
      Calculations retain exact fractions. ≈ marks a display rounded to 15 significant digits.
      History clears on reload.
    </p>
    <form onsubmit={manual}>
      <select aria-label="Calculator operation" bind:value={operator}>
        <option value="+">+</option>
        <option value="-">−</option>
        <option value="*">×</option>
        <option value="/">÷</option>
      </select>
      <input
        class="numeric"
        aria-label="Calculator number"
        type="text"
        inputmode="decimal"
        bind:value={operand}
        onkeydown={entryKey}
      >
      <button type="submit" onkeydown={entryKey}>Apply</button>
    </form>
    {#if problem}
      <p role="alert">{problem}</p>
    {/if}
    <ol aria-label="Calculator history">
      {#each history as entry, index (index)}
        <li>
          <code class="source">{entry.source}</code>
          <span class="numeric"
            >{@render number(entry.before)}
            {entry.operator}
            {@render number(entry.operand)}
            =
            <strong>{@render number(entry.result)}</strong></span
          >
        </li>
      {:else}
        <li>No calculations yet.</li>
      {/each}
    </ol>
    <div class="controls">
      <Hint
        icon={UndoIcon}
        label="Undo last"
        text="Undo the last calculator operation"
        disabled={history.length === 0}
        onactivate={undo}
      />
      <button type="button" onclick={clear}>Clear</button>
    </div>
  </div>
</aside>
{#if layout.visible && (positionsOpen || (placement.drag && placement.dragged))}
  <CalculatorSnapGrid
    {placement}
    choosing={positionsOpen}
    onchoose={(position) => {
      layout = { ...layout, position: position.id };
      positionsOpen = false;
    }}
    oncancel={() => {
      positionsOpen = false;
    }}
  />
{/if}

<style>
.highlight-layer {
  position: fixed;
  inset: 0 auto auto 0;
  width: 0;
  height: 0;
  margin: 0;
  padding: 0;
  border: 0;
  overflow: visible;
  background: transparent;
  pointer-events: none;
}
.highlight {
  position: fixed;
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  pointer-events: none;
}
.preview {
  position: fixed;
  left: 0.75rem;
  display: grid;
  gap: 0.5rem;
  width: min(23rem, calc(100vw - 1.5rem));
  margin: 0;
  padding: 0.75rem;
  border: 1px solid var(--accent);
  background: var(--panel);
  color: var(--text);
  font-size: var(--text-small);
  overflow-wrap: anywhere;
}
.preview-hint {
  color: var(--muted);
}
.preview-value {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 0.6rem;
  font-size: var(--text-section);
  font-weight: var(--weight-medium);
}
.preview-operator {
  display: grid;
  place-items: center;
  min-width: 2rem;
  min-height: 2rem;
  border: 1px solid var(--accent);
  background: var(--soft);
  color: var(--accent);
}
.preview-source {
  display: grid;
  gap: 0.2rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--divider);
}
.source {
  display: block;
  color: var(--muted);
}
aside {
  position: fixed;
  z-index: 100;
  width: min(23rem, calc(100vw - 1.5rem));
  max-height: calc(100dvh - 2rem - var(--preview-space));
  overflow: auto;
  border: 1px solid var(--line);
  background: var(--panel);
  box-shadow: 0 2px 12px rgb(0 0 0 / 18%);
  font-size: var(--text-small);
}
.active {
  border-color: var(--accent);
}
.total {
  font-size: var(--text-body);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
}
.panel-heading {
  display: flex;
  align-items: stretch;
}
.move {
  cursor: grab;
  touch-action: none;
}
.move:active {
  cursor: grabbing;
}
output {
  margin-left: auto;
  font-variant-numeric: tabular-nums;
  overflow-wrap: anywhere;
}
#calculator-details {
  padding: 0 0.6rem 0.6rem;
}
p {
  margin-block: 0.5rem;
  color: var(--muted);
}
form {
  display: flex;
  gap: 0.4rem;
}
select {
  flex: none;
  width: 3.5rem;
}
input {
  flex: 1;
  width: 0;
  min-width: 0;
}
form button {
  flex: none;
  white-space: nowrap;
}
.panel-heading > :global(button) {
  margin: 0;
  border: 0;
}
.panel-heading > :global(button:focus-visible) {
  outline-offset: -2px;
}
ol {
  padding-left: 1.5rem;
  max-height: 12rem;
  overflow: auto;
  font-variant-numeric: tabular-nums;
}
li {
  overflow-wrap: anywhere;
}
.controls {
  display: flex;
  gap: 0.4rem;
}
[role="alert"] {
  color: var(--danger);
}
@media (hover: none) and (pointer: coarse) {
  aside {
    display: none;
  }
}
</style>
