<script lang="ts">
import type { SalRecord } from "../data/model.d.ts";
import { type SettingsSection, settingsSections } from "../ui-state.ts";
import type { Workspace } from "../workspace.svelte.ts";
import Backups from "./backups.svelte";
import KeyboardShortcuts from "./keyboard-shortcuts.svelte";
import PageWidth from "./page-width.svelte";
import RecordEditor from "./record-editor.svelte";

let {
  workspace,
  disabled,
  section,
  onsection,
  onchange,
  widthPreview = $bindable<string | null>(null),
}: {
  workspace: Workspace;
  disabled: boolean;
  section: SettingsSection;
  onsection: (next: SettingsSection) => Promise<void>;
  onchange: (record: SalRecord) => Promise<string | null>;
  widthPreview: string | null;
} = $props();
</script>

<h2>Settings</h2>
<nav aria-label="Settings sections">
  {#each settingsSections as item (item.id)}
    <button type="button" aria-pressed={section === item.id} onclick={() => onsection(item.id)}>
      {item.label}
    </button>
  {/each}
</nav>
{#if section === "preferences"}
  <section aria-label="Shared settings">
    <h3 tabindex="-1" data-settings-heading>Preferences</h3>
    <PageWidth {workspace} {disabled} bind:preview={widthPreview} />
    <RecordEditor
      record={workspace.settings("preferences")}
      preferenceScope="app"
      {disabled}
      {onchange}
    />
  </section>
{:else if section === "defaults"}
  <section aria-label="Shared offer defaults">
    <h3 tabindex="-1" data-settings-heading>Offer defaults</h3>
    <RecordEditor
      record={workspace.settings("preferences")}
      preferenceScope="defaults"
      {disabled}
      {onchange}
    />
  </section>
{:else if section === "backups"}
  <section aria-label="Backups" tabindex="-1" data-settings-heading>
    <Backups {workspace} />
  </section>
{:else}
  <KeyboardShortcuts
    record={workspace.settings("preferences", true)}
    {disabled}
    onsave={(next) => workspace.save([next])}
  />
{/if}

<style>
nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 1rem;
}
[aria-pressed="true"] {
  border-color: var(--accent);
  background: var(--soft);
  color: var(--accent);
}
</style>
