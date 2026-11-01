<script lang="ts">
import type { EditState } from "../edit-state.svelte.ts";
import type { Workspace } from "../workspace.svelte.ts";

let { workspace, edits }: { workspace: Workspace; edits: EditState } = $props();
let status = $derived(summary());
function summary() {
  if (workspace.conflict) {
    return { tone: "error", title: "Save conflict", detail: "Choose which version to keep." };
  }
  if (workspace.busy) {
    return { tone: "pending", title: "Saving…", detail: "Writing changes to this browser." };
  }
  const invalid = edits.pending.filter((entry) => entry.invalid).length;
  if (invalid > 0) {
    let detail = "Review highlighted fields. Other edits can still save.";
    if (workspace.error) {
      detail = workspace.error;
    }
    return {
      tone: "error",
      title: "Changes not saved",
      detail,
    };
  }
  if (workspace.error) {
    return { tone: "error", title: "Changes need attention", detail: workspace.error };
  }
  if (edits.pending.length > 0) {
    return {
      tone: "pending",
      title: "Unsaved changes",
      detail: "Finish the field to save automatically.",
    };
  }
  if (workspace.status === "Saved locally") {
    return {
      tone: "saved",
      title: "Saved locally",
      detail: "Your changes are stored in this browser.",
    };
  }
  return { tone: "pending", title: "Storage status", detail: workspace.status };
}
export function review(): void {
  let element = document.querySelector<HTMLElement>("#save-problem");
  const [first] = edits.pending;
  if (!workspace.conflict && first) {
    element = document.querySelector<HTMLElement>(`#${CSS.escape(first.id)}`);
  }
  let parent = element?.parentElement;
  while (parent) {
    if (parent instanceof HTMLDetailsElement) {
      parent.open = true;
    }
    parent = parent.parentElement;
  }
  element?.scrollIntoView({ block: "center" });
  element?.focus();
}
</script>

<div class="save" data-tone={status.tone}>
  <output aria-live="polite" aria-atomic="true" aria-label="Save status">
    <strong title={status.detail}
      ><span class="dot" aria-hidden="true"></span>{status.title}</strong
    >
    <span class="detail" class:sr-only={status.tone === "saved"}>{status.detail}</span>
  </output>
  {#if status.tone === "error" || edits.pending.length > 0}
    <button type="button" onclick={review}>Review changes</button>
  {/if}
</div>

<style>
.save {
  display: flex;
  align-items: center;
  justify-content: end;
  gap: 0.75rem;
  min-width: 0;
  padding: 0.45rem 0.65rem;
  background: var(--soft);
}
output {
  display: grid;
  text-align: right;
  font-size: var(--text-small);
  min-width: 0;
}
strong {
  display: flex;
  align-items: center;
  justify-content: end;
  gap: 0.45rem;
}
.dot {
  width: 0.5rem;
  height: 0.5rem;
  background: var(--accent);
  flex: none;
}
.detail {
  color: var(--muted);
  max-width: 35rem;
  overflow-wrap: anywhere;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
[data-tone="error"] strong {
  color: var(--danger);
}
[data-tone="error"] .dot {
  background: var(--danger);
}
button {
  flex: none;
}
@media (width <= 48rem) {
  .save {
    gap: 0.4rem;
    flex-wrap: wrap;
  }
  output {
    font-size: var(--text-small);
  }
  .detail {
    max-width: 20rem;
  }
}
</style>
