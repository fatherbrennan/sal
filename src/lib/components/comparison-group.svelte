<script lang="ts">
import ChevronRightIcon from "@primeicons/svelte/chevron-right";

let {
  title,
  controls,
  alwaysVisible = false,
  expanded = $bindable(),
}: {
  title: string;
  controls: string;
  alwaysVisible?: boolean | undefined;
  expanded: string[];
} = $props();

function toggle(): void {
  if (expanded.includes(title)) {
    expanded = expanded.filter((entry) => entry !== title);
  } else {
    expanded = [...expanded, title];
  }
}
</script>

{#if alwaysVisible}
  <span class="group-title">{title}</span>
{:else}
  <button
    data-disclosure={title}
    type="button"
    aria-expanded={expanded.includes(title)}
    aria-controls={controls}
    onclick={toggle}
  >
    <span class="group-label">
      <span class="icon" aria-hidden="true">
        <ChevronRightIcon />
      </span>
      {title}
    </span>
  </button>
{/if}

<style>
.group-title {
  font-weight: var(--weight-medium);
  position: sticky;
  left: 0.75rem;
  display: block;
  width: max-content;
  max-width: 100%;
}
button {
  display: block;
  width: 100%;
  background: transparent;
  border: 0;
  text-align: left;
  padding: 0.4rem 0.75rem;
}
button:hover {
  background: var(--panel);
}
button:focus-visible {
  outline-offset: -3px;
}
.group-label {
  position: sticky;
  left: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  width: max-content;
  max-width: 100%;
  min-height: 2.25rem;
}
</style>
