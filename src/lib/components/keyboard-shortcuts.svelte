<script lang="ts">
import InfoIcon from "@primeicons/svelte/info";
import PenToSquareIcon from "@primeicons/svelte/pen-to-square";
import PlusIcon from "@primeicons/svelte/plus";
import TimesIcon from "@primeicons/svelte/times";
import UndoIcon from "@primeicons/svelte/undo";
import { tick } from "svelte";
import type { SalRecord } from "../data/model.d.ts";
import Hint from "../inspector/hint.svelte";
import { keybindings } from "../keybindings.ts";
import { bindingError, displayStroke, validateShortcuts } from "../shortcut-binding.ts";
import { bindingsFor, type ShortcutCommand, shortcutCommands } from "../shortcut-commands.ts";
import { sequenceHelp } from "../shortcut-sequence.ts";
import ChoiceGroup from "./choice-group.svelte";
import ChoiceInput from "./choice-input.svelte";
import FieldFrame from "./field-frame.svelte";
import ShortcutKeys from "./shortcut-keys.svelte";
import ShortcutRecorder from "./shortcut-recorder.svelte";

let {
  record,
  disabled,
  onsave,
}: { record: SalRecord; disabled: boolean; onsave: (record: SalRecord) => Promise<boolean> } =
  $props();
let query = $state("");
const searchId = $props.id();
const columns = 6;
let searchInput: HTMLInputElement | undefined = $state();
let modifiedOnly = $state(false);
let notice = $state("");
let problem = $state("");
let expanded = $state<Record<string, boolean>>({});
let editing = $state<{
  command: ShortcutCommand;
  index: number | null;
  record: SalRecord;
  trigger: HTMLButtonElement;
} | null>(null);
const modified = $derived(
  shortcutCommands.filter((command) => Object.hasOwn(record.fields, command.id)),
);
const matches = $derived(
  shortcutCommands.filter((command) => {
    const keys = bindingsFor(record.fields, command).join(" ");
    return (
      (!modifiedOnly || Object.hasOwn(record.fields, command.id)) &&
      `${command.action} ${command.group} ${displayStroke(keys)} ${keys.replaceAll("Mod", "Ctrl")} ${keys.replaceAll("Mod", "Meta")} ${command.context.join(" ")} ${command.when} ${command.description}`
        .toLowerCase()
        .includes(query.trim().toLowerCase())
    );
  }),
);
const navigation = $derived(
  keybindings.filter(
    (binding) =>
      !modifiedOnly &&
      `${binding.keys.join(" ")} ${binding.action} ${binding.context.join(" ")} ${binding.when} ${binding.description}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  ),
);

async function close(): Promise<void> {
  const trigger = editing?.trigger;
  const action = editing?.command.id;
  editing = null;
  await tick();
  if (trigger?.isConnected) {
    trigger.focus();
  } else if (trigger) {
    const add = document.querySelector<HTMLButtonElement>(
      `#${CSS.escape(`${searchId}-${action}`)}`,
    );
    (add ?? searchInput)?.focus();
  }
}
async function persist(next: SalRecord): Promise<boolean> {
  notice = "";
  problem = "";
  try {
    validateShortcuts(next.fields);
  } catch (error) {
    problem = "Invalid shortcut.";
    if (error instanceof Error) {
      problem = error.message;
    }
    return false;
  }
  const saved = await onsave(next);
  if (saved) {
    notice = "Shortcuts saved locally.";
    await close();
  } else {
    problem = "Not saved. Review the save error or conflict above.";
  }
  return saved;
}
async function change(
  command: ShortcutCommand,
  bindings: string[] | undefined,
  base = record,
): Promise<boolean> {
  const fields = { ...base.fields };
  if (bindings === undefined) {
    delete fields[command.id];
  } else {
    fields[command.id] = bindings.join("\n");
  }
  return await persist({ ...base, fields });
}
function edit(event: MouseEvent, command: ShortcutCommand, index: number | null): void {
  if (event.currentTarget instanceof HTMLButtonElement) {
    editing = { command, index, record, trigger: event.currentTarget };
  }
}
async function remove(command: ShortcutCommand, index: number): Promise<void> {
  const bindings = bindingsFor(record.fields, command).filter((_, current) => current !== index);
  if (await change(command, bindings)) {
    await tick();
    const add = document.querySelector<HTMLButtonElement>(
      `#${CSS.escape(`${searchId}-${command.id}`)}`,
    );
    (add ?? searchInput)?.focus();
  }
}
async function resetAll(): Promise<void> {
  const fields = { ...record.fields };
  for (const command of shortcutCommands) {
    delete fields[command.id];
  }
  await persist({ ...record, fields });
}
</script>

{#snippet detailsToggle(action: string, id: string)}
  <Hint
    icon={InfoIcon}
    compact
    label={`Details for ${action}`}
    text="Show or hide description and conditions"
    expanded={expanded[id] ?? false}
    controls={`${searchId}-details-${id}`}
    onactivate={() => {
      expanded[id] = !expanded[id];
    }}
  />
{/snippet}

{#snippet contextTags(contexts: readonly string[])}
  <ul class="context-tags" aria-label="Contexts">
    {#each contexts as context (context)}
      <li>{context}</li>
    {/each}
  </ul>
{/snippet}

{#snippet commandDetails(id: string, description: string, when: string, columns: number)}
  <tr class="details-row" hidden={!expanded[id]}>
    <td colspan={columns}>
      <div id={`${searchId}-details-${id}`} class="command-details">
        <p class="description">{description}</p>
        <p>
          <strong>When</strong>
          <br>
          <span class="when">{when}</span>
        </p>
      </div>
    </td>
  </tr>
{/snippet}

{#snippet shortcutRow(command: ShortcutCommand, binding: string, index: number)}
  {@const custom = Object.hasOwn(record.fields, command.id)}
  <tr class:alternative={index > 0}>
    <th scope="row" class="command" aria-label={command.action}>
      {command.action}
    </th>
    <td class="category">{command.group}</td>
    <td class="binding">
      <ShortcutKeys value={binding} gesture={command.gesture} />
    </td>
    <td class="context">{@render contextTags(command.context)}</td>
    <td class:custom={binding !== "" && binding !== command.keys} class="source">
      {#if binding === ""}
        Disabled
      {:else if binding === command.keys}
        Default
      {:else}
        Modified
      {/if}
    </td>
    <td class="row-actions">
      <div class="shortcut-buttons">
        {#if index === 0}
          {@render detailsToggle(command.action, command.id)}
        {/if}
        {#if binding !== ""}
          <Hint
            icon={PenToSquareIcon}
            compact
            {disabled}
            label={`Edit ${command.action}: ${displayStroke(binding)}`}
            text="Edit shortcut"
            onactivate={(event) => edit(event, command, index)}
          />
          <Hint
            icon={TimesIcon}
            compact
            {disabled}
            label={`Remove ${command.action}: ${displayStroke(binding)}`}
            text="Remove shortcut"
            onactivate={() => remove(command, index)}
          />
        {/if}
        {#if index === 0}
          <Hint
            icon={PlusIcon}
            compact
            id={`${searchId}-${command.id}`}
            {disabled}
            label={`Add shortcut for ${command.action}`}
            text="Add shortcut"
            onactivate={(event) => edit(event, command, null)}
          />
          <Hint
            icon={UndoIcon}
            compact
            disabled={disabled || !custom}
            label={`Reset ${command.action}`}
            text="Reset defaults for this action"
            onactivate={() => change(command, undefined)}
          />
        {/if}
      </div>
    </td>
  </tr>
{/snippet}

<section class="shortcuts" data-calculator>
  <div class="heading">
    <div>
      <h3 tabindex="-1" data-settings-heading>Keyboard shortcuts</h3>
      <p>
        One row per shortcut. Add alternatives to an action, or open Details for its conditions.
      </p>
    </div>
    <Hint
      icon={UndoIcon}
      disabled={disabled || modified.length === 0}
      label="Reset all shortcuts"
      text="Reset all shortcuts to their defaults"
      onactivate={resetAll}
    />
  </div>
  <div class="toolbar">
    <div class="search">
      <FieldFrame id={searchId} label="Search keyboard shortcuts">
        <input
          id={searchId}
          type="search"
          bind:this={searchInput}
          bind:value={query}
          placeholder="Search commands, keys or contexts…"
        >
      </FieldFrame>
    </div>
    <ChoiceGroup label="Shortcut list">
      <div class="filter">
        <ChoiceInput
          type="checkbox"
          label="Modified only"
          checked={modifiedOnly}
          onchange={(checked) => {
            modifiedOnly = checked;
          }}
        />
        <span class="count">{modified.length}</span>
      </div>
    </ChoiceGroup>
  </div>
  <p class="summary">
    {matches.length + navigation.length}
    commands · Custom shortcuts are saved on this device and included in JSON backups.
  </p>
  {#if notice}
    <p role="status">{notice}</p>
  {/if}
  {#if problem}
    <p role="alert">{problem}</p>
  {/if}
  {#if matches.length > 0 || navigation.length > 0}
    <table>
      <caption>
        Keyboard shortcuts
      </caption>
      <thead>
        <tr>
          <th scope="col">Command</th>
          <th scope="col">Category</th>
          <th scope="col">Shortcut</th>
          <th scope="col">Context</th>
          <th scope="col">Source</th>
          <th scope="col" class="actions-heading">Actions</th>
        </tr>
      </thead>
      {#each matches as command (command.id)}
        <tbody>
          {#each bindingsFor(record.fields, command) as binding, index (index)}
            {@render shortcutRow(command, binding, index)}
          {:else}
            {@render shortcutRow(command, "", 0)}
          {/each}
          {@render commandDetails(command.id, command.description, command.when, columns)}
        </tbody>
      {/each}
      {#each navigation as binding (binding.action)}
        {@const id = `control-${keybindings.indexOf(binding)}`}
        <tbody>
          {#each binding.keys as keys, index (keys)}
            <tr class:alternative={index > 0}>
              <th scope="row" class="command" aria-label={binding.action}>{binding.action}</th>
              <td class="category">Standard controls</td>
              <td class="binding"><ShortcutKeys value={keys} gesture="press" /></td>
              <td class="context">{@render contextTags(binding.context)}</td>
              <td class="source">Fixed</td>
              <td class="row-actions">
                <div class="shortcut-buttons">
                  {#if index === 0}
                    {@render detailsToggle(binding.action, id)}
                  {/if}
                </div>
              </td>
            </tr>
          {/each}
          {@render commandDetails(id, binding.description, binding.when, columns)}
        </tbody>
      {/each}
    </table>
  {/if}
  <details class="shortcut-guide">
    <summary>How shortcuts work</summary>
    <p>
      Native focus and control keys, and recorder Save/Cancel, are fixed. Other actions can be
      edited, added or reset.
    </p>
    <p>
      Bindings conflict only within the same context. A focused control or visible tooltip handles
      its keys before a containing panel or global action.
    </p>
    <p>
      <strong>Contexts:</strong>
      Global means the page can handle the shortcut without its target panel having focus. It does
      not mean unconditional. Every When condition must hold; “or” identifies alternatives. A named
      control context requires focus there unless the row says otherwise.
    </p>
    <p>
      <strong>Application keys:</strong>
      The binding must be enabled and match. The browser must deliver a fresh keypress, outside text
      composition and AltGraph input, that no control has consumed. Calculator visible means shown
      on screen, including its collapsed state; touch-only layouts hide it. “Unmodified” means no
      Ctrl, Command, Alt or Shift. Local controls ignore consumed keys, text composition and
      AltGraph.
    </p>
    <p><strong>Sequences (“then”):</strong> {sequenceHelp}</p>
    <p>
      <strong>Held keys:</strong>
      Keep the final key or combination pressed while clicking a value. Normal typing stays
      available. Tooltips, dropdowns and dialogs keep their own keyboard controls.
    </p>
    <p>
      Ctrl/⌘ uses Ctrl on Windows/Linux or Command on macOS. Calculator history lasts until cleared
      or reloaded.
    </p>
  </details>
  {#if matches.length === 0 && navigation.length === 0}
    <p role="status">No matching shortcuts.</p>
  {/if}
</section>
{#if editing}
  <ShortcutRecorder
    command={editing.command}
    bindingIndex={editing.index}
    fields={editing.record.fields}
    {disabled}
    onsave={(binding) => {
      if (
        !editing ||
        bindingError(editing.command, binding, editing.record.fields, editing.index)
      ) {
        return Promise.resolve(false);
      }
      const bindings = bindingsFor(editing.record.fields, editing.command);
      if (editing.index === null) {
        bindings.push(binding);
      } else {
        bindings[editing.index] = binding;
      }
      return change(editing.command, bindings, editing.record);
    }}
    oncancel={close}
  />
{/if}

<style>
.heading,
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}
h3 {
  margin-block: 0 0.35rem;
}
.heading p {
  margin: 0;
  color: var(--muted);
}
.toolbar {
  padding-block: 1rem;
}
.search {
  flex: 1;
  min-width: min(100%, 18rem);
}
.search input {
  width: 100%;
}
.filter {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.count {
  border: 1px solid var(--line);
  padding: 0.1rem 0.4rem;
}
.summary,
.category,
.source {
  color: var(--muted);
  font-size: var(--text-small);
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-small);
  line-height: var(--leading-compact);
}
caption {
  text-align: left;
  padding-block: 0.5rem;
  font-weight: var(--weight-medium);
}
th,
td {
  text-align: left;
  vertical-align: middle;
  padding: 0.35rem 0.5rem;
  border-bottom: 1px solid var(--divider);
}
thead {
  background: var(--soft);
}
tbody tr:hover {
  background: var(--soft);
}
th {
  font-weight: var(--weight-medium);
}
.command {
  width: 30%;
}
.command,
.category,
.source {
  white-space: nowrap;
}
.binding {
  width: 28%;
}
.context-tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.3rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
.context-tags li {
  border: 1px solid var(--line);
  padding: 0.1rem 0.4rem;
  background: var(--soft);
  color: var(--text);
  white-space: nowrap;
}
.alternative .command {
  color: var(--muted);
  font-weight: var(--weight-regular);
}
.details-row[hidden] {
  display: none;
}
.details-row td {
  background: var(--soft);
  padding: 0.8rem 1rem;
}
.command-details {
  max-width: 85ch;
  line-height: var(--leading-body);
}
.command-details p {
  margin: 0;
}
.command-details strong {
  color: var(--text);
  margin-right: 0.5rem;
}
.shortcut-guide {
  color: var(--muted);
  font-size: var(--text-small);
  margin-block: 1rem;
}
.shortcut-guide p {
  margin-block: 0.3rem;
}
.command-details p + p {
  margin-top: 0.4rem;
  color: var(--muted);
}
.row-actions {
  width: 1%;
  white-space: nowrap;
}
.actions-heading {
  text-align: right;
}
.shortcut-buttons {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.25rem;
}
.binding :global(.keys) {
  justify-content: flex-start;
}
.custom {
  color: var(--accent);
}
details {
  margin-top: 1.5rem;
  border-bottom: 0;
}
summary {
  cursor: pointer;
  padding-block: 0.75rem;
}
[role="alert"] {
  color: var(--danger);
}
@media (max-width: 65rem) {
  thead {
    display: none;
  }
  tbody tr:not([hidden]) {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    border-bottom: 1px solid var(--line);
    padding-block: 0.4rem;
  }
  th,
  td {
    align-self: center;
    border: 0;
    overflow-wrap: anywhere;
  }
  .command {
    width: auto;
    grid-column: 1 / -1;
    white-space: normal;
  }
  .source {
    grid-column: 2;
    grid-row: 2;
    text-align: right;
  }
  .category {
    grid-row: 2;
  }
  .binding,
  .context,
  .details-row td {
    grid-column: 1 / -1;
    width: auto;
  }
  .row-actions {
    width: auto;
    grid-column: 1 / -1;
    grid-row: 5;
  }
  .binding {
    grid-row: 3;
  }
  .context {
    grid-row: 4;
  }
}
</style>
