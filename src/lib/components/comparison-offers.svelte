<script module lang="ts">
import type { SalRecord } from "../data/model.d.ts";

export function offerLabel(offer: SalRecord): string {
  const name = offer.name || "Untitled offer";
  if (offer.archived) {
    return `${name} (archived)`;
  }
  return name;
}
</script>

<script lang="ts">
import { rows, value } from "../calculations/inputs.ts";
import Combobox from "./combobox.svelte";
import FieldFrame from "./field-frame.svelte";

let {
  record,
  offers,
  disabled,
  onchange,
}: {
  record: SalRecord;
  offers: SalRecord[];
  disabled: boolean;
  onchange: (next: SalRecord) => Promise<string | null>;
} = $props();
const inputId = $props.id();
const selected = $derived(rows(record, "offers").map((item) => value(item.fields, "offerId")));
const options = $derived(offers.map((offer) => ({ id: offer.id, label: offerLabel(offer) })));
const summary = $derived(
  selected.flatMap((id) =>
    options.filter((option) => option.id === id).map((option) => option.label),
  ),
);

async function selectOffers(ids: string[]): Promise<void> {
  const existing = rows(record, "offers");
  const next = ids.map(
    (id) =>
      existing.find((item) => value(item.fields, "offerId") === id) ?? {
        id: crypto.randomUUID(),
        fields: { offerId: id },
      },
  );
  let { fields } = record;
  if (!ids.includes(value(fields, "baseline"))) {
    fields = { ...fields, baseline: "" };
  }
  await onchange({ ...record, fields, items: { ...record.items, offers: next } });
}
</script>

<FieldFrame id={inputId} label="Offers to compare">
  <Combobox
    {inputId}
    label="Offers to compare"
    placeholder="Search offers…"
    {options}
    multiple
    {selected}
    {disabled}
    onselect={selectOffers}
  />
  {#snippet support()}
    <p class="hint">Selected: {summary.join(", ") || "None"}</p>
    {#if selected.some((id) => id !== "" && !offers.some((offer) => offer.id === id))}
      <button
        type="button"
        {disabled}
        onclick={() =>
          selectOffers(selected.filter((id) => offers.some((offer) => offer.id === id)))}
      >
        Remove missing offers
      </button>
    {/if}
  {/snippet}
</FieldFrame>
