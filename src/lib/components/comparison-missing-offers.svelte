<script lang="ts">
import { rows, value } from "../calculations/inputs.ts";
import type { SalRecord } from "../data/model.d.ts";

let { record, offers }: { record: SalRecord; offers: SalRecord[] } = $props();
const missing = $derived(
  rows(record, "offers").some((item) => {
    const id = value(item.fields, "offerId");
    return id !== "" && !offers.some((offer) => offer.id === id);
  }),
);
</script>

{#if missing}
  <p role="status">
    Some selected offers are missing from local storage. Only available offers are shown. Open Edit
    comparison to remove missing offers, or restore them from a backup.
  </p>
{/if}
