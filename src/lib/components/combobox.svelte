<script module lang="ts">
export interface ComboboxOption {
  id: string;
  label: string;
  keywords?: string;
}
export type Selection =
  | {
      multiple?: false;
      selected: string;
      onselect: (id: string) => void | Promise<void>;
    }
  | {
      multiple: true;
      selected: readonly string[];
      onselect: (ids: string[]) => void | Promise<void>;
    };
</script>

<script lang="ts">
import TimesIcon from "@primeicons/svelte/times";
import { type Snippet, tick } from "svelte";
import { controlShortcuts } from "../control-shortcuts.ts";
import Hint from "../inspector/hint.svelte";
import { localKey } from "../keybindings.ts";

type Props = Selection & {
  options: readonly ComboboxOption[];
  label: string;
  listLabel?: string;
  placeholder: string;
  inputId?: string;
  disabled?: boolean;
  displaySelection?: boolean;
  optionDetail?: Snippet<[ComboboxOption]>;
};
let props: Props = $props();
const shortcuts = controlShortcuts();
const id = $props.id();
const optionsId = `${id}-options`;
let query = $state("");
let open = $state(false);
let active = $state(-1);
let input: HTMLInputElement | undefined = $state();
let root: HTMLDivElement | undefined = $state();
let list: HTMLDivElement | undefined = $state();
const inputValue = $derived.by(() => {
  if (props.displaySelection && !props.multiple && !open) {
    return props.options.find((option) => option.id === props.selected)?.label ?? "";
  }
  return query;
});
const matches = $derived(
  props.options.filter((node) =>
    `${node.label} ${node.keywords ?? ""}`.toLowerCase().includes(query.trim().toLowerCase()),
  ),
);
const activeId = $derived.by(() => {
  if (open && matches[active]) {
    return `${optionsId}-${active}`;
  }
  return null;
});
const triggerLabel = $derived.by(() => {
  if (open) {
    return "Hide options";
  }
  return "Show all options";
});

function close(): void {
  open = false;
  active = -1;
  if (props.displaySelection) {
    query = "";
  }
}
async function choose(node: ComboboxOption): Promise<void> {
  if (props.disabled) {
    return;
  }
  if (props.multiple) {
    let selected = [...props.selected, node.id];
    if (props.selected.includes(node.id)) {
      selected = props.selected.filter((selectedId) => selectedId !== node.id);
    }
    await props.onselect(selected);
    return;
  }
  close();
  query = "";
  await props.onselect(node.id);
  if (props.displaySelection) {
    await tick();
    input?.select();
  }
}
function isSelected(nodeId: string): boolean {
  if (props.multiple) {
    return props.selected.includes(nodeId);
  }
  return props.selected === nodeId;
}
function move(direction: string): void {
  open = true;
  if (matches.length === 0) {
    return;
  }
  if (direction === "ArrowDown") {
    active = (active + 1) % matches.length;
  } else if (active <= 0) {
    active = matches.length - 1;
  } else {
    active -= 1;
  }
}
async function key(event: KeyboardEvent): Promise<void> {
  if (props.disabled) {
    return;
  }
  if (event.key === "Tab" && localKey(event)) {
    close();
    return;
  }
  const ids = [
    "shortcutComboPrevious",
    "shortcutComboNext",
    "shortcutComboSelect",
    "shortcutComboClose",
  ] as const;
  let available: readonly (typeof ids)[number][] = ids;
  if (!open) {
    available = ["shortcutComboPrevious", "shortcutComboNext"];
  }
  const action = shortcuts.match(event, available);
  if (action === "shortcutComboNext") {
    move("ArrowDown");
  } else if (action === "shortcutComboPrevious") {
    move("ArrowUp");
  } else if (action === "shortcutComboSelect") {
    const node = matches[active];
    event.preventDefault();
    if (node) {
      await choose(node);
    }
  } else if (action === "shortcutComboClose") {
    event.preventDefault();
    event.stopPropagation();
    close();
  }
}
$effect(() => {
  if (activeId) {
    list?.children[active]?.scrollIntoView({ block: "nearest" });
  }
});
</script>

<svelte:document
  onpointerdown={(event) => {
    if (event.target instanceof Node && !root?.contains(event.target)) {
      close();
    }
  }}
/>
<div class="search" bind:this={root}>
  <div class="control">
    <input
      bind:this={input}
      value={inputValue}
      id={props.inputId}
      readonly={props.disabled}
      aria-disabled={props.disabled}
      type="search"
      role="combobox"
      aria-label={props.label}
      aria-autocomplete="list"
      aria-expanded={open}
      aria-controls={optionsId}
      aria-activedescendant={activeId}
      autocomplete="off"
      placeholder={props.placeholder}
      onfocus={() => {
        open = !props.disabled;
      }}
      onclick={() => {
        open = !props.disabled;
      }}
      oninput={(event) => {
        query = event.currentTarget.value;
        open = true;
        active = -1;
      }}
      onblur={close}
      onkeydown={key}
    >
    {#if query && !props.disabled}
      <span class="clear">
        <Hint
          icon={TimesIcon}
          compact
          label="Clear search"
          text="Clear search"
          onpointerdown={(event) => event.preventDefault()}
          onactivate={() => {
            query = "";
            active = -1;
            input?.focus();
            open = true;
          }}
        />
      </span>
    {/if}
    <button
      class="trigger"
      type="button"
      disabled={props.disabled}
      tabindex="-1"
      aria-label={triggerLabel}
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-controls={optionsId}
      onpointerdown={(event) => event.preventDefault()}
      onclick={() => {
        if (open) {
          close();
        } else {
          query = "";
          input?.focus();
          open = true;
        }
      }}
    >
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <path d="m5 7.5 5 5 5-5" fill="none" stroke="currentColor" stroke-width="1.75" />
      </svg>
    </button>
  </div>
  <div class="popup" hidden={!open}>
    <div
      id={optionsId}
      role="listbox"
      aria-label={props.listLabel ?? props.label}
      aria-multiselectable={props.multiple || undefined}
      bind:this={list}
    >
      {#each matches as node, index (node.id)}
        <button
          id={`${optionsId}-${index}`}
          class="option"
          type="button"
          disabled={props.disabled}
          role="option"
          tabindex="-1"
          aria-selected={isSelected(node.id)}
          data-highlighted={active === index}
          onpointerdown={(event) => event.preventDefault()}
          onclick={() => choose(node)}
        >
          <span>{node.label}</span>
          {@render props.optionDetail?.(node)}
          {#if isSelected(node.id)}
            <span class="check" aria-hidden="true">✓</span>
          {/if}
        </button>
      {/each}
    </div>
    {#if matches.length === 0}
      <p role="status">No matching values. Try a shorter name.</p>
    {/if}
  </div>
</div>

<style>
.search {
  position: relative;
  margin-top: var(--combobox-spacing, 0.4rem);
  --combobox-height: 2.25rem;
  --combobox-font-size: var(--text-body);
  --combobox-option-height: 36px;
  --combobox-option-padding: 5px 32px 5px 8px;
  --combobox-popup-padding: 4px;
  --combobox-option-gap: 2px;
  --combobox-option-detail-size: var(--text-small);
  --combobox-empty-size: var(--text-small);
  --combobox-empty-padding: 8px 10px;
  --combobox-check-size: var(--text-body);
}
.control {
  box-sizing: border-box;
  display: flex;
  width: 100%;
  height: var(--combobox-height);
  min-height: var(--combobox-height);
  max-height: var(--combobox-height);
  overflow: hidden;
  border: var(--combobox-border, 1px solid var(--line));
  background: var(--panel);
}
.control:focus-within {
  outline: var(--combobox-outline, 3px solid var(--accent));
  outline-offset: 2px;
}
input {
  box-sizing: border-box;
  flex: 1;
  width: 100%;
  min-width: 0;
  min-height: 0;
  height: 100%;
  padding: 0 6px;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--text);
  font-size: var(--combobox-font-size);
  line-height: var(--leading-icon);
}
input::placeholder {
  font: inherit;
  color: var(--muted);
  opacity: 1;
}
@supports selector(input::-webkit-search-cancel-button) {
  input::-webkit-search-cancel-button {
    display: none;
  }
}
.trigger,
.clear {
  box-sizing: border-box;
  display: grid;
  flex: 0 0 var(--combobox-height);
  width: var(--combobox-height);
  min-width: 0;
  height: 100%;
  min-height: 0;
  padding: 0;
  place-items: center;
  border: 0;
  touch-action: manipulation;
}
.clear :global(button) {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  min-height: 0;
  padding: 0;
  border: 0;
}
svg {
  width: 14px;
  height: 14px;
}
.popup {
  position: absolute;
  z-index: 20;
  top: calc(100% + 4px);
  inset-inline: 0;
  max-height: min(320px, 45vh);
  padding: var(--combobox-popup-padding);
  overflow: auto;
  overscroll-behavior: contain;
  border: 1px solid var(--line);
  background: var(--panel);
  box-shadow: 0 4px 12px rgb(0 0 0 / 18%);
}
.option {
  position: relative;
  display: grid;
  gap: var(--combobox-option-gap);
  box-sizing: border-box;
  width: 100%;
  min-height: var(--combobox-option-height);
  padding: var(--combobox-option-padding);
  border: 0;
  text-align: left;
  font-size: var(--combobox-font-size);
  line-height: var(--leading-compact);
  font-weight: var(--weight-regular);
  overflow-wrap: anywhere;
  touch-action: manipulation;
}
.option[data-highlighted="true"],
.option:hover {
  background: var(--soft);
}
.check {
  position: absolute;
  top: 50%;
  right: 8px;
  transform: translateY(-50%);
  color: var(--accent);
  font-size: var(--combobox-check-size);
  line-height: var(--leading-icon);
}
.option :global(*) {
  font-size: inherit;
}
.option :global(small) {
  font-size: var(--combobox-option-detail-size);
}
p {
  margin: 0;
  padding: var(--combobox-empty-padding);
  color: var(--muted);
  font-size: var(--combobox-empty-size);
  line-height: var(--leading-compact);
}
@media (width <= 48rem) {
  .search {
    --combobox-height: 1.75rem;
    --combobox-font-size: var(--text-small);
    --combobox-option-height: 28px;
    --combobox-option-padding: 3px 26px 3px 6px;
    --combobox-popup-padding: 3px;
    --combobox-option-gap: 1px;
    --combobox-option-detail-size: var(--text-small);
    --combobox-empty-size: var(--text-small);
    --combobox-empty-padding: 6px 8px;
    --combobox-check-size: var(--text-small);
  }
  .search svg {
    width: 12px;
    height: 12px;
  }
  .search .check {
    right: 7px;
  }
  .popup {
    max-height: 50vh;
  }
}
</style>
