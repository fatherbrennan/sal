<script lang="ts">
import type { Workspace } from "../workspace.svelte.ts";
import ChoiceGroup from "./choice-group.svelte";
import ChoiceInput from "./choice-input.svelte";
import RecordDifferences from "./record-differences.svelte";

let { workspace }: { workspace: Workspace } = $props();
let choices = $state<Record<string, "local" | "mine">>({});
</script>

{#if workspace.conflict}
  <section aria-label="Resolve conflicting edits" class="conflict">
    <h2>Another tab changed this data</h2>
    <p>Your edit has not overwritten the stored version. Compare both versions and choose.</p>
    {#each workspace.conflict.mine as mine (mine.id)}
      {@const stored = workspace.conflict.stored.find((record) => record.id === mine.id)}
      <fieldset>
        <legend>{mine.name || mine.kind}</legend>
        <RecordDifferences current={stored} incoming={mine} />
        <ChoiceGroup label="Version to keep">
          <ChoiceInput
            type="radio"
            label="Keep my edit"
            name={mine.id}
            checked={choices[mine.id] === "mine"}
            onchange={() => {
              choices = { ...choices, [mine.id]: "mine" };
            }}
          />
          <ChoiceInput
            type="radio"
            label="Keep stored version"
            name={mine.id}
            checked={choices[mine.id] === "local"}
            onchange={() => {
              choices = { ...choices, [mine.id]: "local" };
            }}
          />
        </ChoiceGroup>
      </fieldset>
    {/each}
    <button type="button" onclick={() => workspace.resolve(choices)}>
      Resolve selected versions
    </button>
  </section>
{/if}

<style>
.conflict {
  border: 2px solid var(--accent);
  padding: 1rem;
  margin-block: 1rem;
}
fieldset {
  min-width: 0;
}
</style>
