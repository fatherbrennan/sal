<script lang="ts">
import type { SalRecord } from "../data/model.d.ts";

let {
  formula,
  active = $bindable(),
  disabled,
}: { formula: SalRecord; active: string; disabled: boolean } = $props();
</script>

<button
  type="button"
  aria-label={`Select ${formula.name || "Untitled formula"} row`}
  aria-pressed={active === formula.id}
  {disabled}
  onclick={() => {
    if (active === formula.id) {
      active = "";
    } else {
      active = formula.id;
    }
  }}
>
  {formula.name || "Untitled formula"}
  <small
    >Custom formula
    {#if formula.archived}
      · archived
    {/if}</small
  >
</button>

<style>
button {
  display: block;
  width: 100%;
  text-align: left;
  background: transparent;
  border: 0;
}
button[aria-pressed="true"] {
  box-shadow: inset 3px 0 var(--accent);
}
small {
  display: block;
  color: var(--muted);
  font-size: var(--text-small);
  font-weight: var(--weight-regular);
}
</style>
