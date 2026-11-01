<script lang="ts">
import CalculatorIcon from "@primeicons/svelte/calculator";
import CloneIcon from "@primeicons/svelte/clone";
import EraserIcon from "@primeicons/svelte/eraser";
import UndoIcon from "@primeicons/svelte/undo";
import { onMount, setContext, tick } from "svelte";
import "../app.css";
import { value } from "../lib/calculations/inputs.ts";
import { comparisonLabel } from "../lib/comparison-presentation.ts";
import Calculator from "../lib/components/calculator.svelte";
import ChoiceGroup from "../lib/components/choice-group.svelte";
import ChoiceInput from "../lib/components/choice-input.svelte";
import Comparison from "../lib/components/comparison.svelte";
import Conflicts from "../lib/components/conflicts.svelte";
import FieldFrame from "../lib/components/field-frame.svelte";
import Formulas from "../lib/components/formulas.svelte";
import OfferSummary from "../lib/components/offer-summary.svelte";
import OfflineStatus from "../lib/components/offline-status.svelte";
import RecordEditor from "../lib/components/record-editor.svelte";
import SaveStatus from "../lib/components/save-status.svelte";
import Settings from "../lib/components/settings.svelte";
import SettingsShortcuts from "../lib/components/settings-shortcuts.svelte";
import { provideControlShortcuts } from "../lib/control-shortcuts.ts";
import type { SalRecord } from "../lib/data/model.d.ts";
import { EditState, editContext } from "../lib/edit-state.svelte.ts";
import Hint from "../lib/inspector/hint.svelte";
import { rememberSurface } from "../lib/remember-surface.ts";
import type { MissingInput } from "../lib/result-presentation.ts";
import {
  type MainView,
  mainViews,
  navigationLabels,
  readUiState,
  recordKinds,
  type SettingsSection,
  type SurfaceState,
  selectedRecord,
  surfaceName,
} from "../lib/ui-state.ts";
import { UiStateStorage } from "../lib/ui-state-storage.ts";
import { Workspace } from "../lib/workspace.svelte.ts";

const workspace = new Workspace();
provideControlShortcuts(() => workspace.settings("preferences", true).fields);
const uiStorage = new UiStateStorage();
let uiReady = $state(false);
let scenarioSelections = $state<Record<string, string>>({});
let surfaces = $state<Record<string, SurfaceState>>({});
let calculator = $state(readUiState(undefined, []).calculator);
const calculatorHint = $derived.by(() => {
  if (calculator.visible) {
    return "Hide calculator";
  }
  return "Show calculator";
});
let returnComparison = $state<{ id: string; metric: string } | null>(null);
const edits = setContext(editContext, new EditState());
let view = $state<MainView>("offers");
let settingsSection = $state<SettingsSection>("preferences");
let selectedId = $state("");
let surfaceKey = $derived.by(() => {
  if (!uiReady) {
    return "";
  }
  return surfaceName(view, settingsSection, selectedId);
});
let selections = $state<Record<string, string>>({});
let pendingEdit: Promise<string | null> | null = null;
let saveStatus: { review: () => void } | undefined = $state();
let showArchived = $state(false);
let offerFilter = $state("");
let headerHeight = $state(0);
let widthPreview = $state<string | null>(null);
let selected = $derived(workspace.find(selectedId));
let summaryYear = $derived(value(workspace.settings("preferences").fields, "year"));
let offers = $derived(
  workspace.records
    .filter((record) => record.kind === "offer")
    .toSorted((left, right) =>
      (left.name || "Untitled offer").localeCompare(right.name || "Untitled offer", "en-AU"),
    ),
);
let comparisons = $derived(workspace.records.filter((record) => record.kind === "comparison"));
let disabled = $derived(
  workspace.busy || workspace.conflict !== null || !workspace.ready || !uiReady,
);
onMount(() => {
  let closed = false;
  Promise.all([workspace.open(), uiStorage.open()]).then(([, raw]) => {
    if (closed) {
      return;
    }
    const state = readUiState(raw, workspace.records);
    ({ view, settingsSection, showArchived } = state);
    selections = {
      offers: state.offerId,
      comparisons: state.comparisonId,
      formulas: state.formulaId,
    };
    selectedId = selections[view] ?? "";
    scenarioSelections = state.scenarios;
    ({ surfaces, calculator } = state);
    uiReady = true;
  });
  return () => {
    closed = true;
    uiStorage.close();
    workspace.close();
  };
});
$effect(() => {
  if (uiReady) {
    const state = readUiState(
      {
        version: 1,
        view,
        settingsSection,
        offerId: value(selections, "offers"),
        comparisonId: value(selections, "comparisons"),
        formulaId: value(selections, "formulas"),
        showArchived,
        scenarios: scenarioSelections,
        surfaces,
        calculator,
      },
      workspace.records,
    );
    // Keep archived offers open for restore/duplicate; persistence still excludes hidden offers.
    const offerId = selectedRecord(value(selections, "offers"), "offer", workspace.records, true);
    if (
      value(selections, "offers") !== offerId ||
      value(selections, "comparisons") !== state.comparisonId ||
      value(selections, "formulas") !== state.formulaId
    ) {
      selections = { offers: offerId, comparisons: state.comparisonId, formulas: state.formulaId };
    }
    if (recordKinds.has(view)) {
      selectedId = selections[view] ?? "";
    }
    if (JSON.stringify(scenarioSelections) !== JSON.stringify(state.scenarios)) {
      scenarioSelections = state.scenarios;
    }
    uiStorage.save(state);
  }
});
$effect(() => {
  document.documentElement.style.setProperty("--app-header-height", `${headerHeight}px`);
});
$effect(() => {
  document.documentElement.setAttribute(
    "data-appearance",
    value(workspace.settings("preferences").fields, "appearance"),
  );
});
$effect(() => {
  document.documentElement.setAttribute(
    "data-font-size",
    value(workspace.settings("preferences").fields, "fontSize"),
  );
});
$effect(() => {
  const width =
    widthPreview ?? (value(workspace.settings("preferences").fields, "pageWidth") || "100");
  document.documentElement.style.setProperty("--app-width", `${width}%`);
});
async function create(kind: "offer" | "comparison" | "formula"): Promise<void> {
  if (!(await canNavigate())) {
    return;
  }
  const id = await workspace.create(kind);
  if (id !== null) {
    await selectRecord(id);
    await tick();
    document.querySelector<HTMLInputElement>(".content input")?.focus();
  }
}
async function navigate(next: MainView): Promise<void> {
  if (!(await canNavigate())) {
    return;
  }
  view = next;
  selectedId = selections[next] ?? "";
  const kind = recordKinds.get(next);
  if (kind) {
    selectedId = selectedRecord(
      selectedId,
      kind,
      workspace.records,
      next !== "offers" || showArchived,
    );
    selections = { ...selections, [next]: selectedId };
  }
}
async function openSettings(section: SettingsSection): Promise<void> {
  if (!(await canNavigate())) {
    return;
  }
  view = "settings";
  settingsSection = section;
  await tick();
  document.querySelector<HTMLElement>("[data-settings-heading]")?.focus();
}
async function duplicateRecord(): Promise<void> {
  if (!(await canNavigate()) || (selected?.kind !== "offer" && selected?.kind !== "formula")) {
    return;
  }
  const id = await workspace.duplicateRecord(selected);
  if (id !== null) {
    await selectRecord(id);
    await tick();
    const name = document.querySelector<HTMLInputElement>('.content [data-input-key="name"] input');
    name?.focus();
    name?.select();
  }
}
async function selectRecord(id: string): Promise<void> {
  if (await canNavigate()) {
    selectedId = id;
    selections = { ...selections, [view]: id };
  }
}
function inputElement(target: string): HTMLElement | null {
  const selector = `.content [data-input-key="${CSS.escape(target)}"]`;
  return document.querySelector<HTMLElement>(`${selector} input, ${selector} select`);
}
async function resolveInput(offerId: string, input: MissingInput, metric = ""): Promise<void> {
  if (!(await canNavigate())) {
    return;
  }
  if (view === "comparisons") {
    returnComparison = { id: selectedId, metric };
  }
  if (input.scope === "profile") {
    view = "profile";
  } else {
    view = "offers";
    selectedId = offerId;
    selections = { ...selections, offers: offerId };
  }
  await tick();
  let element = inputElement(input.target);
  if (element === null) {
    const mode = inputElement("work-pattern-mode");
    if (mode instanceof HTMLSelectElement) {
      mode.value = "true";
      mode.dispatchEvent(new Event("change", { bubbles: true }));
      await tick();
      element = inputElement(input.target);
    }
  }
  let parent = element?.parentElement;
  while (parent) {
    if (parent instanceof HTMLDetailsElement) {
      parent.open = true;
      // Synchronise bound disclosure state before another render can close the target.
      parent.dispatchEvent(new Event("toggle"));
    }
    parent = parent.parentElement;
  }
  element?.scrollIntoView({ block: "center" });
  element?.focus();
}
async function returnToComparison(): Promise<void> {
  const target = returnComparison;
  if (!(target && (await canNavigate()))) {
    return;
  }
  view = "comparisons";
  selectedId = target.id;
  selections = { ...selections, comparisons: target.id };
  returnComparison = null;
  await tick();
  document
    .querySelector<HTMLElement>(`[data-jump="${CSS.escape(target.metric)}"]`)
    ?.focus({ preventScroll: true });
}
function protectEdits(event: BeforeUnloadEvent): void {
  if (workspace.busy || edits.pending.length > 0) {
    event.preventDefault();
  }
}
function saveEdit(record: SalRecord): Promise<string | null> {
  pendingEdit = workspace.edit(record);
  return pendingEdit;
}
function saveInspectorPin(pinned: boolean): Promise<boolean> {
  const preferences = workspace.settings("preferences", true);
  let inspectorPinned = "no";
  if (pinned) {
    inspectorPinned = "yes";
  }
  return workspace.save([
    {
      ...preferences,
      fields: { ...preferences.fields, inspectorPinned },
    },
  ]);
}
async function canNavigate(): Promise<boolean> {
  await pendingEdit;
  await tick();
  const ready = uiReady && workspace.ready && edits.pending.length === 0 && !workspace.busy;
  if (!ready) {
    saveStatus?.review();
  }
  return ready;
}
</script>

<svelte:head>
  <title>sal</title>
  <meta name="description" content="Australian salary package comparisons">
</svelte:head>

<a class="skip" href="#content">Skip to content</a>
{#if uiReady}
  <Calculator bind:layout={calculator} shortcuts={workspace.settings("preferences", true).fields} />
{/if}
<SettingsShortcuts
  {disabled}
  shortcuts={workspace.settings("preferences", true).fields}
  onopen={openSettings}
/>
<svelte:window onbeforeunload={protectEdits} />
<header bind:clientHeight={headerHeight}>
  <div class="header-inner">
    <div class="brand">
      <h1>sal</h1>
    </div>
    <nav aria-label="Main navigation">
      {#each mainViews as tab (tab)}
        <button type="button" aria-pressed={view === tab} onclick={() => navigate(tab)}>
          {navigationLabels[tab] ?? tab}
        </button>
      {/each}
    </nav>
    <span class="calculator-toggle" data-calculator>
      <Hint
        id="calculator-toggle"
        controls="quick-calculator"
        icon={CalculatorIcon}
        label="Calculator"
        text={calculatorHint}
        pressed={calculator.visible}
        disabled={!uiReady}
        onactivate={() => {
          calculator = { ...calculator, visible: !calculator.visible };
        }}
      />
    </span>
    <SaveStatus {workspace} {edits} bind:this={saveStatus} />
  </div>
</header>
<main
  id="content"
  use:rememberSurface={{
    key: surfaceKey,
    saved: surfaces[surfaceKey],
    onchange: (key, state) => {
      surfaces = { ...surfaces, [key]: state };
    },
  }}
>
  {#if returnComparison && view !== "comparisons"}
    <button type="button" onclick={returnToComparison}>
      Return to comparison
      {#if returnComparison.metric}
        · {comparisonLabel(returnComparison.metric)}
      {/if}
    </button>
  {/if}
  <div id="save-problem" tabindex="-1">
    {#if workspace.error}
      <p role="alert" class="error">{workspace.error}</p>
    {/if}
    <Conflicts {workspace} />
  </div>
  {#if !(workspace.ready && uiReady)}
    <p>{workspace.status}. Your existing data will not be replaced.</p>
  {:else if view === "offers" || view === "comparisons"}
    <div class="layout" class:comparison-layout={view === "comparisons"}>
      {#if view === "offers"}
        <aside aria-label="Saved records">
          <button class="primary" type="button" {disabled} onclick={() => create("offer")}>
            New offer
          </button>
          <ChoiceGroup label="Offer list">
            <ChoiceInput
              type="checkbox"
              label="Show archived"
              checked={showArchived}
              onchange={(checked) => {
                showArchived = checked;
              }}
            />
          </ChoiceGroup>
          <FieldFrame id="offer-filter" label="Filter offers">
            <input id="offer-filter" type="search" bind:value={offerFilter}>
          </FieldFrame>
          {#each offers.filter(
            (offer) =>
              (showArchived || !offer.archived) &&
              (offer.name || "Untitled offer")
                .toLocaleLowerCase()
                .includes(offerFilter.trim().toLocaleLowerCase()),
          ) as offer (offer.id)}
            <button
              type="button"
              class="record"
              aria-pressed={selectedId === offer.id}
              onclick={() => selectRecord(offer.id)}
            >
              {offer.name || "Untitled offer"}
              {#if offer.archived}
                · archived
              {/if}
            </button>
          {/each}
        </aside>
      {:else}
        <div class="comparison-picker">
          <FieldFrame id="saved-comparison" label="Saved comparison">
            <select
              id="saved-comparison"
              value={selectedId}
              {disabled}
              onchange={async (event) => {
                const control = event.currentTarget;
                await selectRecord(control.value);
                control.value = selectedId;
              }}
            >
              <option value="">Choose a comparison</option>
              {#each comparisons as comparison (comparison.id)}
                <option value={comparison.id}>{comparison.name || "Untitled comparison"}</option>
              {/each}
            </select>
          </FieldFrame>
          <button class="primary" type="button" {disabled} onclick={() => create("comparison")}>
            New comparison
          </button>
        </div>
      {/if}
      <section class="content" aria-label="Selected record">
        {#if selected}
          {#key selected.id}
            {#if selected.kind === "offer"}
              <div class="heading">
                <h2>{selected.name || "New offer"}</h2>
                <div class="offer-actions">
                  <Hint
                    icon={CloneIcon}
                    label="Duplicate offer"
                    text="Duplicate offer"
                    {disabled}
                    onactivate={duplicateRecord}
                  />
                  {#if selected.archived}
                    <Hint
                      icon={UndoIcon}
                      label="Restore offer"
                      text="Restore this archived offer to the offer list"
                      {disabled}
                      onactivate={() => {
                        if (selected) {
                          workspace.edit({ ...selected, archived: false });
                        }
                      }}
                    />
                  {:else}
                    <Hint
                      icon={EraserIcon}
                      label="Archive offer"
                      text="Archive offer"
                      {disabled}
                      onactivate={() => {
                        if (selected) {
                          workspace.edit({ ...selected, archived: true });
                        }
                      }}
                    />
                  {/if}
                </div>
              </div>
              {#if summaryYear === "2025-26" || summaryYear === "2026-27"}
                <OfferSummary
                  offer={workspace.effectiveOffer(selected)}
                  profile={workspace.settings("profile").fields}
                  vehicle={workspace.settings("vehicle").fields}
                  year={summaryYear}
                  onresolve={(input) => resolveInput(selectedId, input)}
                />
              {/if}
              <RecordEditor
                record={selected}
                effective={workspace.effectiveOffer(selected)}
                profile={workspace.settings("profile").fields}
                defaults={workspace.settings("preferences").fields}
                {disabled}
                onchange={saveEdit}
              />
            {:else}
              <h2>{selected.name || "New comparison"}</h2>
              <Comparison
                record={selected}
                formulas={workspace.latestRecords.filter((record) => record.kind === "formula")}
                onformulas={() => navigate("formulas")}
                scenario={(Object.hasOwn(scenarioSelections, selected.id) &&
                  scenarioSelections[selected.id]) ||
                  "guaranteed"}
                onscenario={(scenario) => {
                  if (selected) {
                    scenarioSelections = { ...scenarioSelections, [selected.id]: scenario };
                  }
                }}
                offers={workspace.latestRecords
                  .filter((record) => record.kind === "offer")
                  .map((record) => workspace.effectiveOffer(record, true))}
                {disabled}
                profile={workspace.settings("profile", true).fields}
                vehicle={workspace.settings("vehicle", true).fields}
                inspectorPinned={value(
                  workspace.settings("preferences", true).fields,
                  "inspectorPinned",
                ) === "yes"}
                onpin={saveInspectorPin}
                onchange={saveEdit}
                onresolve={resolveInput}
              />
            {/if}
          {/key}
        {:else}
          <h2>Compare the whole package</h2>
          <p>
            Create offers, enter your personal tax settings, then choose offers and a baseline in a
            comparison.
          </p>
        {/if}
      </section>
    </div>
  {:else if view === "formulas"}
    <Formulas
      records={workspace.records}
      {selectedId}
      {disabled}
      offers={workspace.latestRecords
        .filter((record) => record.kind === "offer")
        .map((record) => workspace.effectiveOffer(record, true))}
      profile={workspace.settings("profile", true).fields}
      vehicle={workspace.settings("vehicle", true).fields}
      initialComparison={value(selections, "comparisons")}
      scenariosById={scenarioSelections}
      onscenario={(id, scenario) => {
        scenarioSelections = { ...scenarioSelections, [id]: scenario };
      }}
      onselect={selectRecord}
      oncreate={() => create("formula")}
      onduplicate={duplicateRecord}
      onchange={saveEdit}
    />
  {:else if view === "settings"}
    <section class="content settings" aria-label="Settings">
      <Settings
        {workspace}
        {disabled}
        bind:widthPreview
        section={settingsSection}
        onsection={openSettings}
        onchange={saveEdit}
      />
    </section>
  {:else if view === "profile" || view === "vehicle"}
    {#key view}
      <section class="content settings" aria-label="Shared settings">
        <h2>
          {navigationLabels[view] ?? view}
        </h2>
        <RecordEditor record={workspace.settings(view)} {disabled} onchange={saveEdit} />
      </section>
    {/key}
  {/if}
  <footer>
    <div class="app-info">
      <span>AUD estimates · 2025–26 / 2026–27</span>
      <span>Local only · No account or cloud sync</span>
    </div>
    <OfflineStatus
      storage={workspace.storage}
      safeToReload={workspace.ready &&
        !disabled &&
        workspace.error === "" &&
        edits.pending.length === 0}
    />
  </footer>
</main>

<style>
.header-inner,
nav,
main {
  width: 100%;
  max-width: var(--app-width, 100%);
  min-width: min(320px, 100%);
  margin-inline: auto;
}
header {
  position: sticky;
  top: 0;
  z-index: 20;
  border-bottom: 1px solid var(--divider);
  background: var(--panel);
}
.header-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.75rem;
  flex-wrap: wrap;
}
.brand {
  flex: none;
}
.calculator-toggle {
  display: flex;
  flex: none;
}
.calculator-toggle :global(.icon) {
  font-size: var(--text-title);
}
.brand h1 {
  color: var(--accent);
}
nav {
  display: flex;
  gap: 0.4rem;
  overflow-x: auto;
  padding: 0;
  flex: 1;
  min-width: 0;
}
nav button {
  text-transform: capitalize;
  margin: 0;
  flex: none;
  border-color: transparent;
}
:global(nav button:focus-visible),
footer :global(button:focus-visible),
footer :global(summary:focus-visible) {
  outline: 2px solid var(--accent);
  outline-offset: -2px;
}
[aria-pressed="true"] {
  border-color: var(--accent);
  background: var(--soft);
  color: var(--accent);
}
main {
  padding: 0.75rem;
  container-type: inline-size;
}
.layout {
  display: grid;
  grid-template-columns: 14rem minmax(0, 1fr);
  gap: 0.75rem;
}
.comparison-layout {
  grid-template-columns: minmax(0, 1fr);
}
.comparison-picker {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
}
.comparison-picker :global(.field) {
  width: min(100%, 28rem);
}
aside {
  min-width: 0;
  align-self: start;
  position: sticky;
  top: calc(var(--app-header-height) + 1rem);
  max-height: calc(100dvh - var(--app-header-height) - 2rem);
  overflow-y: auto;
}
.primary {
  width: 100%;
}
.comparison-picker .primary {
  width: auto;
}
.record {
  display: block;
  width: 100%;
  text-align: left;
  margin: 0.25rem 0;
  overflow-wrap: anywhere;
}
.record[aria-pressed="true"] {
  box-shadow: inset 3px 0 var(--accent);
}
.content {
  min-width: 0;
}
.heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}
.heading h2 {
  margin: 0;
  overflow-wrap: anywhere;
}
.offer-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.settings h2 {
  text-transform: capitalize;
}
.error {
  color: var(--danger);
}
footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  color: var(--muted);
  font-size: var(--text-small);
  margin-top: 0.5rem;
  padding-bottom: 3rem;
}
.app-info {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 1rem;
}
.skip {
  position: absolute;
  top: -10rem;
  left: 1rem;
  z-index: 30;
  padding: 1rem;
  background: var(--panel);
}
.skip:focus {
  top: 0;
}
@container (width <= 48rem) {
  .layout {
    grid-template-columns: minmax(0, 1fr);
  }
  aside {
    position: static;
    max-height: 24rem;
    overflow-y: auto;
    border-bottom: 1px solid var(--divider);
    padding-bottom: 0.5rem;
  }
}
@media (width <= 48rem) {
  .header-inner {
    align-items: center;
    gap: 0.75rem;
    padding: 0.65rem 0.85rem;
  }
  nav {
    order: 3;
    flex-basis: 100%;
  }
  main {
    padding: 0.85rem;
  }
}
@media (hover: none) and (pointer: coarse) {
  .calculator-toggle {
    display: none;
  }
}
</style>
