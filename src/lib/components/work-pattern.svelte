<script lang="ts">
import UndoIcon from "@primeicons/svelte/undo";
import { getContext, type Snippet } from "svelte";
import { attendance } from "../calculations/calendar.ts";
import { rows, total, value } from "../calculations/inputs.ts";
import { defaultRoster } from "../data/defaults.ts";
import type { Fields, Item, SalRecord } from "../data/model.d.ts";
import { numeric } from "../data/numeric.ts";
import {
  changeWorkFields,
  duration,
  finishTime,
  type Weekday,
  weeklyDays,
} from "../data/work-pattern.ts";
import { type EditState, editContext } from "../edit-state.svelte.ts";
import { paidHoursEquation, patternEquation, shiftEquation } from "../explanations/work.ts";
import { choices, select } from "../fields/helpers.ts";
import { rosterFields } from "../fields/roster.ts";
import { display } from "../format.ts";
import Hint from "../inspector/hint.svelte";
import EquationPopup from "./equation-popup.svelte";
import FieldFrame from "./field-frame.svelte";
import FieldInput from "./field-input.svelte";

interface Props {
  record: SalRecord;
  shown: SalRecord;
  defaults: Fields;
  disabled: boolean;
  onchange: (record: SalRecord) => Promise<string | null>;
  custom: Snippet;
  calendar: Snippet;
}
let { record, shown, defaults, disabled, onchange, custom, calendar }: Props = $props();
let customView = $state(false);
let element: HTMLDetailsElement | undefined = $state();
const edits = getContext<EditState | undefined>(editContext);
let pending = $derived(
  edits?.pending.filter((entry) =>
    element?.contains(document.querySelector(`#${CSS.escape(entry.id)}`)),
  ) ?? [],
);
const modeId = $props.id();
const hoursTolerance = 0.000_001;
const times = rosterFields.filter(({ key }) =>
  ["start", "hours", "breakStart", "breakMinutes"].includes(key),
);
const places = choices([
  ["off", "Off"],
  ["onsite", "On site"],
  ["remote", "Remote"],
]);
let days = $derived(weeklyDays(shown));
$effect(() => {
  if (days === null) {
    customView = true;
  }
});
let roster = $derived(rows(shown, "roster"));
let year = $derived(value(defaults, "year"));
let annual = $derived.by(() => {
  if (year === "2025-26" || year === "2026-27") {
    return attendance(shown, year);
  }
  return null;
});
let weekHours = $derived(total(roster.map(({ fields }) => numeric(fields, "hours"))));
let paidHours = $derived(numeric(shown.fields, "weeklyHours"));
let summary = $derived.by(() => {
  if (days === null) {
    return `Custom pattern · ${value(shown.fields, "cycleDays") || "unknown"}-day cycle`;
  }
  if (
    value(shown.fields, "rosterComplete") !== "yes" ||
    roster.some(
      ({ fields }) =>
        numeric(fields, "hours") === null ||
        numeric(fields, "journeys") === null ||
        !value(fields, "place"),
    )
  ) {
    return "Complete the work pattern to see its weekly summary.";
  }
  const working = roster.filter(({ fields }) => (numeric(fields, "hours") ?? 0) > 0);
  const onsite = working.filter(({ fields }) => value(fields, "place") === "onsite").length;
  const trips = total(working.map(({ fields }) => numeric(fields, "journeys")));
  return `${duration(weekHours)} · ${working.length} workdays · ${onsite} on-site days · ${display(trips, "number")} round trips per normal week`;
});
function saveRoster(next: readonly Item[]): Promise<string | null> {
  if (
    !customView &&
    pending.some(({ invalid }) => invalid) &&
    weeklyDays({ ...shown, items: { roster: [...next] } }) === null
  ) {
    return Promise.resolve(
      "Correct or revert invalid work-pattern fields before changing to a custom pattern.",
    );
  }
  return onchange({ ...record, items: { ...record.items, roster: [...next] } });
}
function commonValue(key: string): string {
  const values = new Set(roster.map(({ fields }) => value(fields, key)));
  if (values.size === 1) {
    return values.values().next().value ?? "";
  }
  return "";
}
function commonChange(key: string, next: string): Promise<string | null> {
  return saveRoster(
    roster.map((item) => ({ ...item, fields: changeWorkFields(item.fields, key, next) })),
  );
}
function dayChange(day: Weekday, key: string, next: string): Promise<string | null> {
  if (key === "place" && next === "off") {
    if (pending.some((entry) => entry.label.startsWith(`${day.name}:`))) {
      return Promise.resolve("Correct or revert this day's unsaved times before marking it off.");
    }
    return saveRoster(roster.filter((row) => row.id !== day.item?.id));
  }
  let { item } = day;
  if (item === undefined) {
    const template = defaultRoster(shown.fields, defaults)[0]?.fields ?? {};
    item = { id: crypto.randomUUID(), fields: { ...template, day: String(day.day) } };
  }
  const changed = { ...item, fields: changeWorkFields(item.fields, key, next) };
  return saveRoster([...roster.filter((row) => row.id !== changed.id), changed]);
}
function restore(): Promise<string | null> {
  const fields = Object.fromEntries(
    Object.entries(record.fields).filter(
      ([key]) => !["rosterAnchor", "cycleDays", "rosterComplete"].includes(key),
    ),
  );
  const items = Object.fromEntries(
    Object.entries(record.items).filter(([key]) => key !== "roster"),
  );
  return onchange({ ...record, fields, items });
}
function remote(): Promise<string | null> {
  return saveRoster(
    roster.map((item) => ({ ...item, fields: changeWorkFields(item.fields, "place", "remote") })),
  );
}
function dayPlace(day: Weekday): string {
  if (day.item === undefined) {
    return "off";
  }
  return value(day.item.fields, "place");
}
</script>

<details open class="work-pattern" data-disclosure="Work pattern" bind:this={element}>
  <summary>Work pattern</summary>
  <p class="pattern-summary">
    <EquationPopup label={summary} equations={() => [patternEquation(shown, year)]} />
  </p>
  <p class="hint">
    <EquationPopup
      label={`Standard paid hours: ${duration(paidHours)} per week`}
      equations={() => [paidHoursEquation(paidHours)]}
    />. Calendar work hours are separate.
  </p>
  {#if days !== null &&
    weekHours !== null &&
    paidHours !== null &&
    Math.abs(weekHours - paidHours) > hoursTolerance}
    <p class="notice">
      Roster hours differ from standard paid hours. Check that this is intentional; salary and paid
      hours are unchanged.
    </p>
  {/if}
  <div class="pattern-actions">
    {#if Object.hasOwn(record.items, "roster") ||
      ["rosterAnchor", "cycleDays", "rosterComplete"].some((key) =>
        Object.hasOwn(record.fields, key),
      )}
      <span>Offer work-pattern override.</span>
      <Hint
        icon={UndoIcon}
        label="Use shared work pattern"
        text="Reset this offer to the shared work pattern"
        disabled={disabled || pending.length > 0}
        onactivate={restore}
      />
    {:else}
      <span>Shared work pattern. Editing creates an offer override.</span>
    {/if}
    <button
      type="button"
      disabled={disabled || roster.length === 0 || pending.length > 0}
      onclick={remote}
    >
      Make repeating pattern fully remote
    </button>
  </div>
  <p class="hint">The remote shortcut keeps work times, holidays and dated office visits.</p>
  {#if pending.length > 0}
    <p class="hint">
      Finish or revert unsaved work-pattern fields before switching editors or replacing the
      pattern.
    </p>
  {/if}
  <div class="mode">
    <FieldFrame id={modeId} target="work-pattern-mode" label="Work-pattern editor">
      <select
        id={modeId}
        disabled={disabled || pending.length > 0}
        value={String(customView || days === null)}
        onchange={(event) => {
          customView = event.currentTarget.value === "true";
        }}
      >
        <option value="false" disabled={days === null}>Weekly</option>
        <option value="true">Custom / rotating roster</option>
      </select>
    </FieldFrame>
  </div>
  {#if customView || days === null}
    <p>
      Custom patterns keep their cycle, dates, overnight blocks and trip counts. The weekly view is
      available only when it can represent the pattern without changes.
    </p>
    {@render custom()}
  {:else}
    <details data-disclosure="Common workday times">
      <summary>Common workday times</summary>
      <p class="hint">
        An edit here applies to every workday. Blank fields may be missing or differ by day; each
        day shows its own values below.
      </p>
      <div class="field-grid">
        {#each times as definition (definition.key)}
          <FieldInput
            definition={{ ...definition, label: `Every workday: ${definition.label}` }}
            value={commonValue(definition.key)}
            disabled={disabled || roster.length === 0}
            onvalid={(next) => commonChange(definition.key, next)}
          />
        {/each}
      </div>
    </details>
    <div class="weekdays">
      {#each days as day (day.name)}
        <div class="weekday">
          <FieldInput
            definition={select("place", `${day.name} attendance`, places)}
            target={`roster:${day.item?.id ?? day.name}:place`}
            value={dayPlace(day)}
            {disabled}
            onvalid={(next) => dayChange(day, "place", next)}
          />
          <div class="day-times">
            {#if day.item !== undefined}
              <p>
                <EquationPopup
                  label={`${value(day.item.fields, "start") || "Start unknown"}–${finishTime(day.item.fields)} · ${duration(numeric(day.item.fields, "hours"))} work`}
                  equations={() => [shiftEquation(day.item?.fields ?? {}, day.name)]}
                />
              </p>
              <p class="hint">
                Unpaid break:
                {#if Object.hasOwn(day.item.fields, "breakMinutes")}
                  {display(numeric(day.item.fields, "breakMinutes"), "number")}
                {:else}
                  0
                {/if}
                minutes ·
                {value(day.item.fields, "journeys") || "unknown"}
                round trips
              </p>
              <details data-disclosure={`Times: ${day.name}`}>
                <summary>Edit {day.name} times</summary>
                <div class="field-grid">
                  {#each times as definition (definition.key)}
                    <FieldInput
                      definition={{ ...definition, label: `${day.name}: ${definition.label}` }}
                      target={`roster:${day.item.id}:${definition.key}`}
                      value={value(day.item.fields, definition.key)}
                      {disabled}
                      onvalid={(next) => dayChange(day, definition.key, next)}
                    />
                  {/each}
                </div>
              </details>
            {:else}
              <p>Day off</p>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}
  <details data-disclosure="Public holidays and leave">
    <summary>Public holidays and leave</summary>
    <p>
      SA holiday policy and dated exceptions apply to the financial-year totals. Leave entitlement
      does not mean leave has been taken.
    </p>
    {@render calendar()}
  </details>
  <div class="calendar-summary" aria-live="polite">
    {#if annual !== null}
      <p>
        <EquationPopup
          label={`${year} calendar: ${duration(annual.hours)} work · ${display(annual.onsiteDays, "number")} on-site days · ${display(annual.journeys, "number")} round trips`}
          equations={() => [patternEquation(shown, year)]}
        />
      </p>
      {#if annual.journeys === 0}
        <p>No commuting in this calendar. Distance, time and fuel inputs are not needed.</p>
      {/if}
      {#each annual.notes as note (note)}
        <p class="hint">{note}</p>
      {/each}
    {:else}
      <p>Select a financial year in Defaults to see calendar totals.</p>
    {/if}
  </div>
</details>

<style>
.work-pattern {
  min-width: 0;
}
.pattern-summary {
  font-weight: var(--weight-medium);
}
.hint {
  color: var(--muted);
}
.pattern-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}
.mode {
  display: grid;
  gap: 0.25rem;
  max-width: 24rem;
  margin-block: 0.65rem;
}
.weekdays {
  display: grid;
}
.weekday {
  display: grid;
  grid-template-columns: minmax(9rem, 1fr) minmax(0, 3fr);
  gap: 0.75rem;
  padding-block: 0.5rem;
  border-bottom: 1px solid var(--divider);
}
.day-times {
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.4rem;
}
.day-times details[open] {
  grid-column: 1 / -1;
}
.day-times p {
  margin-block: 0.15rem;
}
.day-times details {
  border: 0;
  padding: 0;
}
.calendar-summary {
  border-top: 1px solid var(--divider);
  margin-top: 0.6rem;
}
@media (max-width: 40rem) {
  .weekday {
    grid-template-columns: minmax(0, 1fr);
    gap: 0.2rem;
  }
  .day-times {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
