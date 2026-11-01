<script lang="ts">
import { displayStroke } from "../shortcut-binding.ts";
import { type ShortcutCommand, shortcutStrokes } from "../shortcut-commands.ts";

let { value, gesture }: { value: string; gesture: ShortcutCommand["gesture"] } = $props();
const strokes = $derived(shortcutStrokes(value, gesture));
</script>

<span class="keys">
  {#if value === ""}
    Unassigned
  {/if}
  {#each strokes as stroke, index (index)}
    {#if index > 0}
      <span class="then">then</span>
    {/if}
    <span class="stroke">
      {#each stroke.split("+") as key, part (part)}
        {#if part > 0}
          <span aria-hidden="true">+</span>
        {/if}
        <kbd
          >{displayStroke(key)
            .replace("Mod", "Ctrl/⌘")
            .replace("Meta", "⌘")
            .replace("ArrowLeft", "←")
            .replace("ArrowRight", "→")
            .replace("ArrowUp", "↑")
            .replace("ArrowDown", "↓")}</kbd
        >
      {/each}
    </span>
  {/each}
  {#if value && gesture === "hold"}
    <span class="instruction">(hold) +</span> <kbd>Click</kbd>
    <span class="instruction">value</span>
  {/if}
</span>

<style>
.keys,
.stroke {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.3rem;
}
kbd {
  border: 1px solid var(--line);
  background: var(--soft);
  padding: 0.1rem 0.35rem;
  font: inherit;
  white-space: nowrap;
}
.then,
.instruction {
  color: var(--muted);
}
</style>
