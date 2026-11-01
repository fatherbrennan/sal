<script lang="ts">
import type { Snippet } from "svelte";

let {
  id,
  label,
  children,
  support,
  target = "",
}: {
  id: string;
  label: string;
  children: Snippet;
  support?: Snippet;
  target?: string;
} = $props();
</script>

<div class="field" data-input-key={target}>
  <div class="box">
    <label for={id}>{label}</label>
    {@render children()}
  </div>
  {@render support?.()}
</div>

<style>
.field {
  display: grid;
  align-content: start;
  gap: 0;
  min-width: 0;
}
.box {
  --combobox-border: 0;
  --combobox-outline: none;
  display: grid;
  grid-row: span 2;
  min-width: 0;
  border: 1px solid var(--line);
  background: var(--panel);
  padding: 0.15rem var(--field-inset);
}
label {
  color: var(--muted);
  font-size: var(--text-small);
  font-weight: var(--weight-medium);
  line-height: var(--leading-compact);
  overflow-wrap: anywhere;
}
.box :global(input),
.box :global(select) {
  min-height: 24px;
}
.box :global(input),
.box :global(select),
.box :global(textarea) {
  min-width: 0;
  border: 0;
  padding: 0;
  background: transparent;
  color: var(--text);
  line-height: var(--leading-compact);
}
.box :global(input::placeholder),
.box :global(textarea::placeholder) {
  color: var(--muted);
  opacity: 1;
}
.box :global(input[type="file"]) {
  font-size: var(--text-body);
}
.box :global(input[type="file"]::file-selector-button) {
  min-height: 24px;
  padding: 0 var(--field-inset);
  border: 0;
  margin-right: var(--field-inset);
}
.box:focus-within {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}
.box :global(:focus-visible) {
  outline: none;
}
.box:has(:global([aria-invalid="true"])) {
  border-color: var(--danger);
}
@supports (grid-template-rows: subgrid) {
  .box {
    grid-template-rows: subgrid;
  }
}
@media (width <= 48rem) {
  /* .field {
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
  } */
}
</style>
