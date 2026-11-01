<script lang="ts">
import type { SalRecord } from "../data/model.d.ts";
import type { Field } from "../fields/helpers.ts";
import { itemFields } from "../fields/items.ts";
import { sections } from "../fields.ts";

interface Entry {
  label: string;
  text: string;
}
let { current, incoming }: { current: SalRecord | undefined; incoming: SalRecord } = $props();
function fieldText(definition: Field, text: string): string {
  return definition.options.find((option) => option.value === text)?.label ?? text;
}
function entries(record: SalRecord | undefined): Map<string, Entry> {
  const result = new Map<string, Entry>();
  if (record === undefined) {
    return result;
  }
  result.set("name", { label: "Name", text: record.name });
  result.set("archived", { label: "Archived", text: String(record.archived) });
  for (const definition of sections[record.kind].flatMap((section) => section.fields)) {
    result.set(definition.key, {
      label: definition.label,
      text: fieldText(definition, record.fields[definition.key] ?? ""),
    });
  }
  for (const [group, items] of Object.entries(record.items)) {
    for (const [index, item] of (items ?? []).entries()) {
      for (const definition of itemFields[group] ?? []) {
        result.set(`${group}:${item.id}:${definition.key}`, {
          label: `${group} ${index + 1} · ${definition.label}`,
          text: fieldText(definition, item.fields[definition.key] ?? ""),
        });
      }
    }
  }
  return result;
}
let local = $derived(entries(current));
let replacement = $derived(entries(incoming));
let changes = $derived(
  [...new Set([...local.keys(), ...replacement.keys()])].filter(
    (key) => local.get(key)?.text !== replacement.get(key)?.text,
  ),
);
</script>

{#if changes.length === 0}
  <p>No field differences.</p>
{:else}
  <div class="differences">
    <table>
      <thead>
        <tr>
          <th scope="col">Changed field</th>
          <th scope="col">Stored version</th>
          <th scope="col">Proposed version</th>
        </tr>
      </thead>
      <tbody>
        {#each changes as key (key)}
          <tr>
            <th scope="row">{replacement.get(key)?.label ?? local.get(key)?.label}</th>
            <td>{local.get(key)?.text || "Not entered"}</td>
            <td>{replacement.get(key)?.text || "Not entered"}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}

<style>
.differences {
  overflow: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th,
td {
  text-align: left;
  padding: 0.5rem;
  border-bottom: 1px solid var(--divider);
  vertical-align: top;
  overflow-wrap: anywhere;
}
</style>
