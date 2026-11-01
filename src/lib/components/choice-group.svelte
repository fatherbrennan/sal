<script lang="ts">
import type { Snippet } from "svelte";

let { label, children }: { label: string; children: Snippet } = $props();
</script>

<fieldset>
  <legend>{label}</legend>
  <div class="choices">{@render children()}</div>
</fieldset>

<style>
fieldset {
  min-width: 0;
  margin: 0.35rem 0;
  border: 1px solid var(--line);
  background: var(--panel);
  padding: 0.15rem var(--field-inset);
}
legend {
  float: left;
  width: 100%;
  padding: 0;
  color: var(--muted);
  font-size: var(--text-small);
  font-weight: var(--weight-medium);
  line-height: var(--leading-compact);
  overflow-wrap: anywhere;
}
.choices {
  clear: both;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr));
  gap: 0 0.5rem;
}
</style>
