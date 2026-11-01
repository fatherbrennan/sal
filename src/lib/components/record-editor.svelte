<script lang="ts">
import UndoIcon from "@primeicons/svelte/undo";
import { tick } from "svelte";
import { rows, value } from "../calculations/inputs.ts";
import { newItemFields, offerDefaultKeys } from "../data/defaults.ts";
import type { Fields, Item, SalRecord } from "../data/model.d.ts";
import { changeWorkFields } from "../data/work-pattern.ts";
import { bonusSuperValue, changeBonusSuper } from "../fields/bonus-super.ts";
import { editorItemFields, editorSections } from "../fields/editor.ts";
import { estimateMode, type Field, field } from "../fields/helpers.ts";
import { groups } from "../fields.ts";
import Hint from "../inspector/hint.svelte";
import { unanswered } from "../result-presentation.ts";
import FieldInput from "./field-input.svelte";
import WorkPattern from "./work-pattern.svelte";

interface Props {
  record: SalRecord;
  effective?: SalRecord;
  profile?: Fields;
  defaults?: Fields;
  preferenceScope?: "app" | "defaults";
  disabled: boolean;
  onchange: (record: SalRecord) => Promise<string | null>;
}
let {
  record,
  effective,
  profile = {},
  defaults = {},
  preferenceScope,
  disabled,
  onchange,
}: Props = $props();
let shown = $derived(effective ?? record);
let visibleSections = $derived(
  editorSections(shown).filter(
    (section) =>
      preferenceScope === undefined ||
      (section.title === "Appearance preferences") === (preferenceScope === "app"),
  ),
);
let opened = $state<Record<string, boolean>>({});
let removed = $state<{ group: string; item: Item; index: number } | null>(null);
async function removeItem(group: string, item: Item, index: number): Promise<void> {
  const error = await changeItems(
    group,
    rows(shown, group).filter((row) => row.id !== item.id),
  );
  await tick();
  if (error === null && !rows(shown, group).some((row) => row.id === item.id)) {
    removed = { group, item, index };
  }
}
async function undoRemove(): Promise<void> {
  const previous = removed;
  if (!previous) {
    return;
  }
  const next = [...rows(shown, previous.group)];
  if (next.some((row) => row.id === previous.item.id)) {
    removed = null;
    return;
  }
  next.splice(previous.index, 0, previous.item);
  const error = await changeItems(previous.group, next);
  await tick();
  if (error === null && rows(shown, previous.group).some((row) => row.id === previous.item.id)) {
    removed = null;
  }
}
const groupLabels: Record<string, string> = {
  earnings: "Additional cash bonuses and commissions",
  perks: "Personal perk values",
  costs: "Additional job costs",
  roster: "Repeating work roster",
  exceptions: "Dated work and leave exceptions",
  holidays: "Applicable public holidays",
  taxOverride: "Personal tax overrides",
};
function changeField(key: string, next: string): Promise<string | null> {
  const fields = { ...record.fields, [key]: next };
  return onchange({ ...record, fields });
}
function changeItems(group: string, next: readonly Item[]): Promise<string | null> {
  let { fields } = record;
  if (group === "holidays") {
    fields = { ...fields, calendarComplete: "" };
  }
  return onchange({ ...record, fields, items: { ...record.items, [group]: [...next] } });
}
function changeItem(
  group: string,
  id: string,
  key: string,
  next: string | undefined,
): Promise<string | null> {
  try {
    return changeItems(
      group,
      rows(shown, group).map((item) => {
        if (item.id === id) {
          if (group === "earnings" && key === "bonusSuper" && next !== undefined) {
            return { ...item, fields: changeBonusSuper(item.fields, next) };
          }
          if (["roster", "exceptions"].includes(group)) {
            return { ...item, fields: changeWorkFields(item.fields, key, next) };
          }
          const fields = { ...item.fields };
          if (next === undefined) {
            delete fields[key];
          } else {
            fields[key] = next;
          }
          return { ...item, fields };
        }
        return item;
      }),
    );
  } catch (error) {
    if (error instanceof Error) {
      return Promise.resolve(error.message);
    }
    throw error;
  }
}
function itemValues(group: string, fields: Fields): Fields {
  if (group === "earnings") {
    return { ...fields, bonusSuper: bonusSuperValue(fields) };
  }
  if (group === "taxOverride") {
    return { ...profile, ...fields };
  }
  return fields;
}
function itemSource(group: string, fields: Fields, key: string): string {
  if (group !== "taxOverride") {
    return "";
  }
  if (Object.hasOwn(fields, key)) {
    return "Offer override";
  }
  return "Shared default";
}
function add(group: string): Promise<string | null> {
  const fields = newItemFields(group);
  return changeItems(group, [...rows(shown, group), { id: crypto.randomUUID(), fields }]);
}
function fieldSource(key: string): string {
  if (effective === undefined || !offerDefaultKeys.has(key)) {
    return "";
  }
  if (Object.hasOwn(record.fields, key)) {
    return "Offer override";
  }
  return "Shared default";
}
function inheritField(key: string): Promise<string | null> {
  const fields = { ...record.fields };
  delete fields[key];
  return onchange({ ...record, fields });
}
function inheritItems(group: string): Promise<string | null> {
  const items = { ...record.items };
  const fields = Object.fromEntries(
    Object.entries(record.fields).filter(
      ([key]) => group !== "holidays" || key !== "calendarComplete",
    ),
  );
  delete items[group];
  return onchange({ ...record, fields, items });
}
</script>

<div class="editor" data-calculator-context={record.id}>
  {#if record.kind === "offer" || record.kind === "comparison"}
    <FieldInput
      definition={field("name", "Name", "text")}
      value={record.name}
      {disabled}
      onvalid={(name) => onchange({ ...record, name })}
    />
  {/if}
  {#if record.kind === "preferences" && preferenceScope !== "app"}
    <p>
      These shared defaults apply to offers that inherit them. Explicit offer overrides stay
      unchanged.
    </p>
  {/if}
  {#snippet estimateSettings()}
    <details data-disclosure="Estimate scope">
      <summary>Estimate scope and saved settings</summary>
      <p>
        Standard estimates cover full-year resident adults and ordinary tax circumstances. Employee
        base pay is ordinary super-eligible pay; representative payroll uses equal pay periods and
        TFN-provided scales, without special adjustments. Super uses ordinary 15% contribution tax,
        excluding cap, Division 293 and special-fund adjustments. Salary sacrifice is allocated
        across equal pay periods and the selected reporting year. These are calculator limits, not
        declarations about you. Saved overrides take precedence.
      </p>
      <FieldInput
        definition={estimateMode}
        value={value(shown.fields, "estimateMode")}
        source={fieldSource("estimateMode")}
        oninherit={() => inheritField("estimateMode")}
        {disabled}
        onvalid={(next) => changeField("estimateMode", next)}
      />
      <p>
        Select explicit calculation inputs for special circumstances. A blank override stays
        unknown; use the shared-default control to resume inheritance.
      </p>
    </details>
  {/snippet}
  {#if record.kind === "profile"}
    {@render estimateSettings()}
  {/if}
  {#if value(shown.fields, "employment") === "sole-trader" && rows(shown, "earnings").length > 0}
    <p role="alert">
      Employee earnings rows do not apply to contractor fees. Include all fees in the revenue quote,
      then remove those rows.
    </p>
  {/if}
  {#if preferenceScope === "defaults"}
    {@render estimateSettings()}
  {/if}
  {#each visibleSections as section, index (section.title)}
    {#if section.title === "Work calendar"}
      <WorkPattern {record} {shown} {defaults} {disabled} {onchange}>
        {#snippet custom()}
          <div class="field-grid">
            {#each section.fields.filter(({ key }) =>
              ["rosterAnchor", "cycleDays"].includes(key),
            ) as definition (definition.key)}
              {@render recordField(definition)}
            {/each}
          </div>
          {@render itemGroup(
            "roster",
            section.fields.find(({ key }) => key === "rosterComplete"),
          )}
        {/snippet}
        {#snippet calendar()}
          <div class="field-grid">
            {#each section.fields.filter(
              ({ key }) => key === "holidaysWorked",
            ) as definition (definition.key)}
              {@render recordField(definition)}
            {/each}
            {#each editorSections(shown)
              .filter((entry) => entry.title === "Saved leave settings")
              .flatMap((entry) => entry.fields) as definition (definition.key)}
              {@render recordField(definition)}
            {/each}
          </div>
          {@render itemGroup("exceptions")}
          {@render itemGroup(
            "holidays",
            section.fields.find(({ key }) => key === "calendarComplete"),
          )}
        {/snippet}
      </WorkPattern>
    {:else if section.title !== "Saved leave settings"}
      {@const count = section.fields.filter((definition) =>
        unanswered(definition, shown.fields),
      ).length}
      <details
        data-disclosure={section.title}
        open={opened[section.title] ?? (index === 0 || record.kind === "vehicle")}
        ontoggle={(event) => {
          opened = { ...opened, [section.title]: event.currentTarget.open };
        }}
      >
        <summary>
          <span>{section.title}</span>
          {#if count > 0}
            <span class="completion">{count} unanswered</span>
          {/if}
        </summary>
        {#if section.title === "Paid annual leave"}
          <p class="hint">Leave entitlement does not change annual earnings or attendance.</p>
        {/if}
        <div class="field-grid">
          {#each section.fields as definition (definition.key)}
            {@render recordField(definition)}
          {/each}
        </div>
        {#if section.title === "Pay details" &&
          (value(shown.fields, "employment") !== "sole-trader" ||
            rows(shown, "earnings").length > 0)}
          {@render itemGroup("earnings")}
        {/if}
      </details>
    {/if}
    {#if section.title === "Commuting costs"}
      {@render itemGroup("perks")}
      {@render itemGroup("costs")}
    {/if}
  {/each}
  {#snippet recordField(definition: Field)}
    <FieldInput
      {definition}
      value={value(shown.fields, definition.key)}
      source={fieldSource(definition.key)}
      sharedValue={value(defaults, definition.key)}
      oninherit={() => inheritField(definition.key)}
      {disabled}
      onvalid={(next) => changeField(definition.key, next)}
    />
  {/snippet}
  {#snippet itemGroup(group: string, completion?: Field)}
    {@const unansweredItems = rows(shown, group).flatMap((item) =>
      editorItemFields(group, item.fields).filter((definition) =>
        unanswered(definition, itemValues(group, item.fields)),
      ),
    ).length}
    <details data-disclosure={group}>
      <summary>
        <span>{groupLabels[group]} ({rows(shown, group).length})</span>
        {#if unansweredItems > 0}
          <span class="completion">{unansweredItems} unanswered</span>
        {/if}
      </summary>
      {#if effective !== undefined && group === "holidays"}
        {#if Object.hasOwn(record.items, group)}
          <p>
            Offer override.
            <Hint
              icon={UndoIcon}
              compact
              label="Use shared default"
              text="Reset this offer to the shared public-holiday calendar"
              {disabled}
              onactivate={() => inheritItems(group)}
            />
          </p>
        {:else}
          <p>Shared default. Editing a row creates a separate calendar or roster for this offer.</p>
        {/if}
      {/if}
      {#if group === "holidays"}
        <p>
          The default calendar contains verified statewide SA holidays for both supported years,
          including 19:00–24:00 holidays. After custom edits, confirm calendar completeness below.
          Overlapping holidays count once.
        </p>
      {:else if group === "roster"}
        <p>
          Cycle days begin at 1. Work hours exclude the unpaid break; the finishing time includes
          it. One journey means home → work → home. Remote days use 0 journeys. Empty cycle days are
          not worked.
        </p>
      {:else if group === "exceptions"}
        <p>
          Each dated exception replaces all work on that calendar date. Use 0 hours and 0 journeys
          for leave. Leave entitlement alone does not remove work days.
        </p>
      {:else if group === "taxOverride"}
        <p>
          Fields inherit your shared profile until overridden. Blank overrides mean unknown; use the
          shared-default control to restore inheritance.
        </p>
      {:else if group === "earnings"}
        <p>
          Enter additional ordinary taxable cash bonuses or commissions, excluding amounts already
          in base pay. Saved exceptions remain editable.
        </p>
      {/if}
      {#each rows(shown, group) as item, index (item.id)}
        {@const values = itemValues(group, item.fields)}
        <fieldset>
          <legend>{groupLabels[group]} {index + 1}</legend>
          <div class="field-grid" class:bonus-fields={group === "earnings"}>
            {#each editorItemFields(group, item.fields) as definition (definition.key)}
              <FieldInput
                {definition}
                target={`${group}:${item.id}:${definition.key}`}
                value={value(values, definition.key)}
                source={itemSource(group, item.fields, definition.key)}
                sharedValue={value(profile, definition.key)}
                oninherit={() => changeItem(group, item.id, definition.key, undefined)}
                {disabled}
                onvalid={(next) => changeItem(group, item.id, definition.key, next)}
              />
            {/each}
          </div>
          <button type="button" {disabled} onclick={() => removeItem(group, item, index)}>
            Remove row {index + 1}
          </button>
        </fieldset>
      {/each}
      {#if removed?.group === group}
        <div class="undo" role="status">
          Row removed.
          <button type="button" {disabled} onclick={undoRemove}>Undo removal</button>
        </div>
      {/if}
      <button
        type="button"
        disabled={disabled || (group === "taxOverride" && rows(record, group).length > 0)}
        onclick={() => add(group)}
      >
        Add {groupLabels[group]}
      </button>
      {#if completion}
        <div class="field-grid">
          {@render recordField(completion)}
        </div>
      {/if}
    </details>
  {/snippet}
  {#each groups[record.kind].filter(
    (group) =>
      !["offers", "earnings", "perks", "costs", "roster", "exceptions", "holidays"].includes(group),
  ) as group (group)}
    {@render itemGroup(group)}
  {/each}
  {#if record.kind === "offer"}
    {@render estimateSettings()}
  {/if}
</div>

<style>
.editor {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  min-width: 0;
  gap: 0.4rem;
}
details {
  margin: 0;
}
.editor > details {
  border-inline: 0;
  border-top: 0;
  padding-inline: 0;
}
.hint {
  color: var(--muted);
  margin: 0;
}
.completion {
  color: var(--muted);
  font-size: var(--text-small);
  font-weight: var(--weight-regular);
  margin-left: 0.75rem;
}
fieldset {
  border: 1px solid var(--divider);
  margin-block: 0.5rem;
  min-width: 0;
}
legend {
  font-weight: var(--weight-medium);
}
.bonus-fields {
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
}
</style>
