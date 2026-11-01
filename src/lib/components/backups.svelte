<script lang="ts">
import { onDestroy } from "svelte";
import type { Backup } from "../data/model.d.ts";
import { readBackup } from "../data/schema.ts";
import { message, type Workspace } from "../workspace.svelte.ts";
import ChoiceGroup from "./choice-group.svelte";
import ChoiceInput from "./choice-input.svelte";
import FieldFrame from "./field-frame.svelte";
import RecordDifferences from "./record-differences.svelte";

let { workspace }: { workspace: Workspace } = $props();
let incoming = $state<Backup | null>(null);
let choices = $state<Record<string, "local" | "import">>({});
let importMessage = $state("");
let download = $state("");
let unresolved = $derived(
  incoming?.records.filter(
    (record) =>
      workspace.records.some((local) => local.id === record.id) &&
      !Object.hasOwn(choices, record.id),
  ).length ?? 0,
);
const id = $props.id();
onDestroy(() => {
  if (download) {
    URL.revokeObjectURL(download);
  }
});
function exportBackup(): void {
  if (download) {
    URL.revokeObjectURL(download);
  }
  download = URL.createObjectURL(
    new Blob([JSON.stringify(workspace.backup())], { type: "application/json" }),
  );
}
async function preview(file: File | undefined): Promise<void> {
  incoming = null;
  choices = {};
  importMessage = "";
  if (file === undefined) {
    return;
  }
  try {
    const parsed: unknown = JSON.parse(await file.text());
    incoming = readBackup(parsed);
  } catch (failure) {
    importMessage = message(failure);
  }
}
async function apply(): Promise<void> {
  if (incoming !== null && (await workspace.import(incoming.records, choices))) {
    incoming = null;
  }
}
</script>

<h2>Backups</h2>
<p>
  Your data stays in this browser. Clearing site data removes it. Save JSON backups somewhere you
  control; nothing is uploaded.
</p>
<section aria-labelledby="export-heading">
  <h3 id="export-heading">Export backup</h3>
  <button type="button" disabled={workspace.busy || !workspace.ready} onclick={exportBackup}>
    Prepare JSON backup
  </button>
  {#if download}
    <a href={download} download="sal-backup.json">Download sal-backup.json</a>
  {/if}
</section>
<section class="import" aria-labelledby="import-heading">
  <h3 id="import-heading">Import backup</h3>
  <FieldFrame {id} label="Preview a JSON backup">
    <input
      {id}
      type="file"
      accept=".json,application/json"
      disabled={workspace.busy}
      onchange={(event) => preview(event.currentTarget.files?.[0])}
    >
  </FieldFrame>
  {#if importMessage}
    <p role="alert">{importMessage} Existing data was not changed.</p>
  {/if}
  {#if incoming}
    <h3>Import preview</h3>
    <p class="notice">{unresolved} existing record(s) still need a version choice.</p>
    <p>
      {incoming.records.length}
      validated records. Exported {incoming.exportedAt}. Imported comparisons use the current rules.
    </p>
    {#each incoming.records as record (record.id)}
      {@const local = workspace.find(record.id)}
      <details>
        <summary>
          {record.name || record.kind}
          {#if local}
            {#if choices[record.id] === "local"}
              — keeping local
            {:else if choices[record.id] === "import"}
              — using backup
            {:else}
              — choose a version
            {/if}
          {:else}
            — new record
          {/if}
        </summary>
        <RecordDifferences current={local} incoming={record} />
        {#if local}
          <ChoiceGroup label="Version to keep">
            <ChoiceInput
              type="radio"
              label="Keep local version"
              name={record.id}
              checked={choices[record.id] === "local"}
              onchange={() => {
                choices = { ...choices, [record.id]: "local" };
              }}
            />
            <ChoiceInput
              type="radio"
              label="Use backup version"
              name={record.id}
              checked={choices[record.id] === "import"}
              onchange={() => {
                choices = { ...choices, [record.id]: "import" };
              }}
            />
          </ChoiceGroup>
        {/if}
      </details>
    {/each}
    <div class="actions">
      <button
        class="primary"
        type="button"
        disabled={workspace.busy || unresolved > 0}
        onclick={apply}
      >
        Apply selected import
      </button>
      {#if unresolved > 0}
        <span>{unresolved} version choices remaining</span>
      {/if}
      <button
        type="button"
        disabled={workspace.busy}
        onclick={() => {
          incoming = null;
        }}
      >
        Cancel import
      </button>
    </div>
  {/if}
</section>

<style>
section {
  border-top: 1px solid var(--divider);
  padding-block: 0.75rem;
}
h3 {
  margin-top: 0;
}
.import {
  margin-block: 1rem;
}
[role="alert"] {
  color: var(--danger);
}
</style>
