<script lang="ts">
import LinkIcon from "@primeicons/svelte/link";
import MicrochipIcon from "@primeicons/svelte/microchip";
import SidebarIcon from "@primeicons/svelte/sidebar";
import TimesIcon from "@primeicons/svelte/times";
import { onDestroy, onMount, type Snippet, setContext, tick } from "svelte";
import { editing } from "../calculator-value.ts";
import { controlShortcuts } from "../control-shortcuts.ts";
import type { ComparisonReference } from "../explanations/model.ts";
import { localKey, trapModalTab } from "../keybindings.ts";
import type { ShortcutId } from "../shortcut-commands.ts";
import { inspectionValue, scrollToReference } from "./comparison-target.ts";
import { type InspectionRequest, type InspectorContext, inspectorContext } from "./context.ts";
import { equationInspection } from "./equations.ts";
import Hint, { dismissHints } from "./hint.svelte";
import Inspector from "./inspector.svelte";
import type { InspectorNode } from "./types.ts";

let {
  children,
  revision,
  reveal,
  inspectorPinned,
  onpin,
  disabled,
}: {
  children: Snippet;
  revision: unknown;
  reveal: (reference: ComparisonReference) => boolean;
  inspectorPinned: boolean;
  onpin: (pinned: boolean) => Promise<boolean>;
  disabled: boolean;
} = $props();
let workspace: HTMLDivElement | undefined = $state();
const shortcuts = controlShortcuts();
let dialog: HTMLDialogElement | undefined = $state();
let inspector: ReturnType<typeof Inspector> | undefined = $state();
let request = $state<InspectionRequest | null>(null);
let requestRevision = $state<unknown>();
let pinned = $state(false);
let canPin = $state(false);
let pinError = $state("");
const pinHint = $derived.by(() => {
  if (pinned) {
    return "Pinned beside comparison. Use drawer instead.";
  }
  return "Pin beside comparison";
});
let sequence = $state(0);
const panelWidth = 36;
let overflow: string | undefined;
let scrollbarWidth = 0;
let selectedValue: HTMLElement | null = null;
let selectedTrigger = $state<HTMLElement | null>(null);
let suspended = $state(false);
let destinationNote = $state("");
let navigation = 0;
let selectedNode: InspectorNode | undefined;
let lastRevision: unknown;
const model = $derived.by(() => {
  if (request && requestRevision === revision) {
    return equationInspection(request.equations(), request.label);
  }
  return null;
});
function lock(): void {
  if (overflow === undefined) {
    ({ overflow } = document.documentElement.style);
    scrollbarWidth = innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.overflow = "hidden";
  }
}
function unlock(): void {
  if (overflow !== undefined) {
    document.documentElement.style.overflow = overflow;
    overflow = undefined;
    scrollbarWidth = 0;
  }
}
async function open(next: InspectionRequest): Promise<void> {
  if (request && selectedTrigger === next.trigger) {
    await resume();
    return;
  }
  dismissHints();
  request?.trigger.removeAttribute("data-inspector-root");
  next.trigger.setAttribute("data-inspector-root", "");
  mark(next.trigger);
  suspended = false;
  destinationNote = "";
  selectedNode = undefined;
  navigation += 1;
  requestRevision = revision;
  request = next;
  pinned = inspectorPinned && canPin;
  pinError = "";
  sequence += 1;
  await tick();
  if (!dialog?.open) {
    if (pinned) {
      dialog?.show();
    } else {
      dialog?.showModal();
    }
  }
  if (pinned) {
    unlock();
  } else {
    lock();
  }
  dialog?.querySelector<HTMLElement>("h2")?.focus({ preventScroll: true });
}
function mark(element: HTMLElement, symbol?: string): void {
  selectedValue?.removeAttribute("data-inspected");
  selectedTrigger = element;
  selectedValue = inspectionValue(element, symbol);
  selectedValue.setAttribute("data-inspected", "true");
}
async function locate(reference: ComparisonReference | undefined): Promise<HTMLElement | null> {
  if (!reference) {
    return null;
  }
  if (!reveal(reference)) {
    return null;
  }
  await tick();
  return (
    workspace?.querySelector<HTMLElement>(
      `[data-comparison="${CSS.escape(reference.key)}"][data-metric="${CSS.escape(reference.metric)}"] .equation-trigger`,
    ) ?? null
  );
}
async function select(node: InspectorNode): Promise<void> {
  selectedNode = node;
  navigation += 1;
  const current = navigation;
  let destination = await locate(node.reference);
  const root = model?.root;
  const exact =
    destination !== null ||
    node.id === root ||
    (root !== undefined && model?.nodes.get(root)?.related?.includes(node.id) === true);
  if (!destination) {
    destination = await locate(node.container);
  }
  if (current !== navigation || !request) {
    return;
  }
  destination ??= request.trigger;
  mark(destination, node.symbol);
  destinationNote = "";
  if (!exact) {
    destinationNote = "No standalone row in this comparison. Show the containing result.";
  }
  await tick();
  scrollToReference(selectedTrigger, selectedValue);
}
async function showComparison(): Promise<void> {
  dismissHints();
  const current = selectedNode ?? model?.nodes.get(model.root);
  if (current) {
    await select(current);
  }
  if (!pinned) {
    suspended = true;
    dialog?.close();
    unlock();
  }
  await tick();
  scrollToReference(selectedTrigger, selectedValue);
  selectedTrigger?.focus({ preventScroll: true });
}
async function resume(): Promise<void> {
  dismissHints();
  suspended = false;
  if (!dialog?.open) {
    dialog?.showModal();
    lock();
  }
  await tick();
  dialog?.querySelector<HTMLElement>("[data-node-heading]")?.focus({ preventScroll: true });
}
function closed(): void {
  if (dialog?.open || suspended) {
    return;
  }
  dismissHints();
  const trigger = selectedTrigger ?? request?.trigger;
  scrollToReference(selectedTrigger, selectedValue);
  navigation += 1;
  request?.trigger.removeAttribute("data-inspector-root");
  request = null;
  pinned = false;
  unlock();
  selectedValue?.removeAttribute("data-inspected");
  selectedValue = null;
  selectedTrigger = null;
  selectedNode = undefined;
  if (trigger?.isConnected) {
    trigger.focus({ preventScroll: true });
  }
}
async function pin(next: boolean, persist = false): Promise<void> {
  pinError = "";
  if (persist && !(await onpin(next))) {
    pinError = "Pin preference was not saved. Close the inspector to review the save problem.";
    return;
  }
  if (!dialog?.open || (next && !canPin)) {
    return;
  }
  pinned = next;
  dialog.close();
  if (next) {
    dialog.show();
    unlock();
  } else {
    dialog.showModal();
    lock();
  }
  await tick();
  dialog.querySelector<HTMLElement>("h2")?.focus({ preventScroll: true });
}
function key(event: KeyboardEvent): void {
  if (!dialog?.contains(document.activeElement)) {
    return;
  }
  const commands: Extract<ShortcutId, "shortcutInspectorBack" | "shortcutInspectorClose">[] = [
    "shortcutInspectorClose",
  ];
  if (!editing(event.target)) {
    commands.push("shortcutInspectorBack");
  }
  const command = shortcuts.match(event, commands);
  if (command) {
    event.preventDefault();
    event.stopPropagation();
    if (command === "shortcutInspectorBack") {
      inspector?.back();
    } else {
      dialog?.close();
    }
    return;
  }
  if (pinned || event.key !== "Tab" || !localKey(event)) {
    return;
  }
  trapModalTab(event, dialog);
}
function measure(): void {
  const table = workspace?.querySelector<HTMLTableElement>(".table-scroll table");
  canPin = false;
  if (workspace && table) {
    const rootSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
    const gap = Number.parseFloat(getComputedStyle(workspace).columnGap);
    const minimum = Number.parseFloat(getComputedStyle(table).minWidth);
    const borders = 2;
    canPin =
      workspace.clientWidth - scrollbarWidth >= minimum + borders + panelWidth * rootSize + gap;
  }
  if (pinned && !canPin) {
    pin(false);
  }
}
setContext<InspectorContext>(inspectorContext, {
  open,
  active: (element) => request !== null && selectedTrigger === element,
});
$effect(() => {
  if (lastRevision !== revision) {
    lastRevision = revision;
    suspended = false;
    dialog?.close();
    closed();
  }
  tick().then(measure);
});
onMount(() => {
  let frame: number | undefined;
  const observer = new ResizeObserver(() => {
    if (frame === undefined) {
      frame = requestAnimationFrame(() => {
        frame = undefined;
        measure();
      });
    }
  });
  if (workspace) {
    observer.observe(workspace);
  }
  measure();
  return () => {
    observer.disconnect();
    if (frame !== undefined) {
      cancelAnimationFrame(frame);
    }
  };
});
onDestroy(() => {
  request?.trigger.removeAttribute("data-inspector-root");
  selectedValue?.removeAttribute("data-inspected");
  unlock();
});
</script>

<div
  class="inspection-workspace"
  class:pinned
  bind:this={workspace}
  style:--inspector-width={`${panelWidth}rem`}
>
  <div class="comparison-content">{@render children()}</div>
  <dialog
    class="drawer"
    class:pinned
    bind:this={dialog}
    aria-label="Calculation inspector"
    onclose={closed}
    oncancel={(event) => {
      // The key handler enforces focus and modifiers before closing.
      event.preventDefault();
    }}
    onkeydown={key}
  >
    <div class="panel-heading">
      <span class="inspector-icon icon" aria-hidden="true">
        <MicrochipIcon />
      </span>
      <h2 tabindex="-1">Calculation inspector</h2>
      <Hint
        icon={LinkIcon}
        label="Show in comparison"
        text="Show in comparison"
        onactivate={showComparison}
      />
      {#if pinned || canPin}
        <Hint
          icon={SidebarIcon}
          label="Pin beside comparison"
          text={pinHint}
          pressed={pinned}
          {disabled}
          onactivate={() => pin(!pinned, true)}
        />
      {/if}
      <Hint
        icon={TimesIcon}
        label="Close"
        text="Close calculation inspector"
        onactivate={() => dialog?.close()}
      />
    </div>
    {#if pinError}
      <p class="destination-note" role="alert">{pinError}</p>
    {/if}
    {#if destinationNote}
      <p class="destination-note" role="status">{destinationNote}</p>
    {/if}
    {#if model}
      {#key sequence}
        <Inspector
          bind:this={inspector}
          {model}
          initial={model.root}
          root={model.root}
          onselect={select}
        />
      {/key}
    {/if}
  </dialog>
</div>

<style>
.inspection-workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1.25rem;
  align-items: start;
}
.inspection-workspace.pinned {
  grid-template-columns: minmax(0, 1fr) var(--inspector-width);
}
.comparison-content {
  min-width: 0;
}
.comparison-content :global(td:has(> span > .equation-trigger)) {
  position: relative;
  isolation: isolate;
}
@media (hover: hover) {
  .comparison-content :global(td:has(> span > .equation-trigger):hover) {
    background-color: color-mix(in srgb, var(--accent) 6%, var(--soft));
  }
}
.comparison-content :global(td > span:first-child > .equation-trigger::after) {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 0;
}
.comparison-content :global(td > :not(span:first-child) :is(button, a)),
.comparison-content :global(td > :is(button, a)),
.comparison-content :global(td .icon-button) {
  position: relative;
  z-index: 1;
}
.comparison-content :global([data-inspected="true"]) {
  outline: 1px solid var(--accent);
  outline-offset: 2px;
}
.panel-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.35rem 0.65rem;
  border-bottom: 1px solid var(--divider);
  background: var(--panel);
  flex: none;
  min-height: 3rem;
}
.panel-heading h2 {
  flex: 1;
  margin: 0;
  font-size: var(--text-section);
}
.inspector-icon {
  display: inline-grid;
  place-items: center;
  flex: none;
  height: 2.25rem;
}
.destination-note {
  margin: 0;
  padding: 0.4rem 0.85rem;
  color: var(--muted);
  font-size: var(--text-small);
}
.drawer {
  position: fixed;
  inset: 0 0 0 auto;
  margin: 0;
  padding: 0;
  width: min(52rem, 100vw);
  max-width: 100vw;
  height: 100dvh;
  max-height: 100dvh;
  border: 0;
  border-left: 1px solid var(--line);
  background: var(--panel);
  color: var(--text);
  overflow: hidden;
}
.drawer[open] {
  display: flex;
  flex-direction: column;
}
.drawer.pinned {
  position: sticky;
  inset: calc(var(--app-header-height, 0px) + 1rem) auto auto;
  width: var(--inspector-width);
  height: calc(100dvh - var(--app-header-height, 0px) - 2rem);
  border: 1px solid var(--line);
}
.drawer::backdrop {
  background: rgb(0 0 0 / 42%);
}
.drawer :global(.inspector) {
  flex: 1;
  min-height: 0;
}
</style>
