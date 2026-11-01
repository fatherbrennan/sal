<script module lang="ts">
const hintState: { close?: (() => void) | undefined } = {};
export function dismissHints(): void {
  hintState.close?.();
}
</script>

<script lang="ts">
import type { ComponentType } from "svelte";
import { onMount } from "svelte";
import { controlShortcuts } from "../control-shortcuts.ts";

let {
  id: buttonId,
  controls: controlledId,
  label,
  text,
  onactivate,
  active = false,
  onpointerdown,
  icon: Icon,
  compact = false,
  pressed,
  expanded,
  disabled = false,
}: {
  id?: string;
  controls?: string;
  label: string;
  text: string;
  onactivate?: (event: MouseEvent) => void;
  active?: boolean;
  onpointerdown?: (event: PointerEvent) => void;
  icon?: ComponentType;
  compact?: boolean;
  pressed?: boolean;
  expanded?: boolean;
  disabled?: boolean;
} = $props();
const id = $props.id();
let trigger: HTMLButtonElement | undefined = $state();
let tip: HTMLSpanElement | undefined = $state();
let visible = $state(false);
let pinned = false;
let hovering = false;
let dismissed = false;
let timer: ReturnType<typeof setTimeout> | undefined;
const pointerExitDelay = 120;

function position(): void {
  if (!(visible && trigger && tip)) {
    return;
  }
  const gap = 8;
  const controls = trigger.closest("dialog")?.querySelectorAll(".panel-heading button") ?? [];
  const right = Math.min(
    innerWidth,
    ...[...controls].map((control) => control.getBoundingClientRect().left),
  );
  tip.style.maxWidth = `min(23rem, ${Math.max(1, right - gap * 2)}px)`;
}
async function show(): Promise<void> {
  clearTimeout(timer);
  if (dismissed || disabled) {
    return;
  }
  if (hintState.close !== hide) {
    hintState.close?.();
  }
  hintState.close = hide;
  visible = true;
  // Focus can arrive inside another popover's native transition.
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  if (!inModalContext()) {
    hide();
    return;
  }
  if (visible && tip?.isConnected && !tip.matches(":popover-open")) {
    tip.showPopover();
    position();
  }
}
function hide(): void {
  clearTimeout(timer);
  tip?.hidePopover();
  visible = false;
  pinned = false;
  if (hintState.close === hide) {
    hintState.close = undefined;
  }
}
function leave(): void {
  hovering = false;
  timer = setTimeout(() => {
    if (!(pinned || hovering || document.activeElement === trigger)) {
      hide();
    }
  }, pointerExitDelay);
}
function activate(event: MouseEvent): void {
  if (onactivate) {
    hide();
    dismissed = true;
    onactivate(event);
  } else if (pinned) {
    hide();
    dismissed = true;
  } else {
    pinned = true;
    dismissed = false;
    show();
  }
}
const shortcuts = controlShortcuts();
onMount(() => {
  function key(event: KeyboardEvent): void {
    if (!inModalContext()) {
      hide();
      return;
    }
    if (visible && shortcuts.match(event, ["shortcutTooltipDismiss"])) {
      event.preventDefault();
      event.stopImmediatePropagation();
      dismissed = true;
      hide();
    }
  }
  function outside(event: PointerEvent): void {
    if (
      event.target instanceof Node &&
      !trigger?.contains(event.target) &&
      !tip?.contains(event.target)
    ) {
      hide();
    }
  }
  document.addEventListener("keydown", key, true);
  document.addEventListener("pointerdown", outside);
  window.addEventListener("resize", position);
  return () => {
    hide();
    document.removeEventListener("keydown", key, true);
    document.removeEventListener("pointerdown", outside);
    window.removeEventListener("resize", position);
  };
});

function inModalContext(): boolean {
  const modal = document.querySelector("dialog:modal");
  return modal === null || (trigger !== undefined && modal.contains(trigger));
}
</script>

<button
  id={buttonId}
  bind:this={trigger}
  type="button"
  class:active
  class:icon-button={Icon !== undefined}
  class:icon-button-compact={compact}
  aria-label={label}
  aria-controls={controlledId}
  {onpointerdown}
  aria-pressed={pressed}
  aria-expanded={expanded}
  {disabled}
  aria-describedby={id}
  onpointerenter={() => {
    hovering = true;
    dismissed = false;
    show();
  }}
  onpointerleave={leave}
  onfocus={() => {
    dismissed = false;
    show();
  }}
  onblur={() => {
    dismissed = false;
    if (!hovering) {
      hide();
    }
  }}
  onclick={activate}
>
  {#if Icon}
    <span class="icon" aria-hidden="true">
      <Icon />
    </span>
  {:else}
    {label}
  {/if}
</button><span
  bind:this={tip}
  {id}
  popover="manual"
  role="tooltip"
  onpointerenter={() => {
    hovering = true;
    clearTimeout(timer);
  }}
  onpointerleave={leave}
  >{text}</span
>

<style>
button:not(.icon-button) {
  padding: 0.2rem 0;
  min-height: 1.75rem;
  border: 0;
  background: transparent;
  color: var(--accent);
  font: inherit;
  text-align: left;
  text-decoration: underline dotted;
  text-underline-offset: 0.22em;
  overflow-wrap: anywhere;
  vertical-align: baseline;
}
button.active {
  background: var(--accent);
  color: var(--panel);
  text-decoration: none;
  font-weight: var(--weight-medium);
}
[role="tooltip"] {
  position: fixed;
  inset: 8px auto auto 8px;
  margin: 0;
  width: max-content;
  max-width: min(23rem, calc(100vw - 1rem));
  padding: 0.65rem 0.8rem;
  border: 1px solid var(--accent);
  background: var(--panel);
  color: var(--text);
  box-shadow: 0 4px 18px rgb(0 0 0 / 18%);
  font: var(--weight-regular) var(--text-small) / var(--leading-body) var(--font-ui);
  white-space: pre-line;
  overflow-wrap: anywhere;
  text-align: left;
  max-height: calc(100dvh - 1rem);
  overflow: auto;
}
</style>
