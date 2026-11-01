<script lang="ts">
import CaretDownIcon from "@primeicons/svelte/caret-down";
import CaretUpIcon from "@primeicons/svelte/caret-up";
import MinusIcon from "@primeicons/svelte/minus";
import PenToSquareIcon from "@primeicons/svelte/pen-to-square";
import { tick } from "svelte";
import { rows, value } from "../calculations/inputs.ts";
import type { SalRecord } from "../data/model.d.ts";
import { selectedFormulas } from "../formulas/results.ts";
import Hint from "../inspector/hint.svelte";
import { smallScreen } from "../small-screen.svelte.ts";
import Combobox from "./combobox.svelte";

let {
  record,
  formulas,
  disabled,
  onchange,
  onmanage,
  active = $bindable(),
}: {
  record: SalRecord;
  formulas: SalRecord[];
  disabled: boolean;
  onchange: (record: SalRecord) => Promise<string | null>;
  onmanage: () => void;
  active: string;
} = $props();
const id = $props.id();
const selected = $derived(selectedFormulas(record, formulas));
const index = $derived(selected.findIndex((formula) => formula.id === active));
const activeRecord = $derived(selected[index]);
const isSmallScreen = smallScreen();
const options = $derived(
  formulas
    .filter(
      (formula) =>
        selected.some((entry) => entry.id === formula.id) ||
        (!formula.archived && formula.name.trim() && value(formula.fields, "expression").trim()),
    )
    .map((formula) => {
      let label = formula.name || "Untitled formula";
      if (formula.archived) {
        label += " (archived)";
      }
      return { id: formula.id, label };
    }),
);

async function select(ids: string[]): Promise<void> {
  const error = await onchange({
    ...record,
    items: {
      ...record.items,
      formulas: ids.map(
        (formulaId) =>
          rows(record, "formulas").find(
            (item) => value(item.fields, "formulaId") === formulaId,
          ) ?? {
            id: crypto.randomUUID(),
            fields: { formulaId },
          },
      ),
    },
  });
  if (!(error || ids.includes(active))) {
    active = "";
  }
}
function move(offset: number): void {
  const ids = selected.map((formula) => formula.id);
  const [moved] = ids.splice(index, 1);
  if (moved !== undefined) {
    ids.splice(index + offset, 0, moved);
    select(ids);
  }
}
async function remove(): Promise<void> {
  await select(selected.filter((entry) => entry.id !== active).map((entry) => entry.id));
  if (!active) {
    await tick();
    document.querySelector<HTMLButtonElement>(`#${CSS.escape(`${id}-manage`)}`)?.focus();
  }
}
</script>

<div class="formula-controls">
  <span class="formula-title" data-jump="Custom formulas" tabindex="-1">Custom formulas</span>
  <Combobox
    inputId={id}
    label="Custom formula rows"
    placeholder="Choose formulas…"
    {options}
    multiple
    selected={selected.map((formula) => formula.id)}
    {disabled}
    onselect={select}
  />
  <Hint
    id={`${id}-manage`}
    icon={PenToSquareIcon}
    label="Manage formulas"
    text="Manage formulas"
    {disabled}
    onactivate={onmanage}
    compact={isSmallScreen.matches}
  />
  {#if activeRecord}
    <Hint
      icon={CaretUpIcon}
      label={`Move ${activeRecord.name} up`}
      text="Move row up"
      disabled={disabled || index === 0}
      onactivate={() => move(-1)}
      compact={isSmallScreen.matches}
    />
    <Hint
      icon={CaretDownIcon}
      label={`Move ${activeRecord.name} down`}
      text="Move row down"
      disabled={disabled || index === selected.length - 1}
      onactivate={() => move(1)}
      compact={isSmallScreen.matches}
    />
    <Hint
      icon={MinusIcon}
      label={`Remove ${activeRecord.name} from comparison`}
      text="Remove this row from the comparison"
      {disabled}
      onactivate={remove}
      compact={isSmallScreen.matches}
    />
  {/if}
</div>

<style>
.formula-title {
  font-weight: var(--weight-medium);
  margin-right: 0.25rem;
}
.formula-controls {
  --combobox-spacing: 0;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.25rem;
}
</style>
