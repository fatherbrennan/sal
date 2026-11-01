<script lang="ts">
import { onMount } from "svelte";
import { editing } from "../calculator-value.ts";
import { dialogOwnsKeys } from "../keybindings.ts";
import { bindingsFor, shortcutCommands, shortcutStrokes } from "../shortcut-commands.ts";
import { ShortcutSequence } from "../shortcut-sequence.ts";
import { watchSequence } from "../shortcut-sequence-events.ts";
import type { SettingsSection } from "../ui-state.ts";

let {
  disabled,
  onopen,
  shortcuts,
}: {
  disabled: boolean;
  onopen: (section: SettingsSection) => Promise<void>;
  shortcuts: Record<string, string>;
} = $props();
const sequence = new ShortcutSequence();
function key(event: KeyboardEvent): void {
  if (event.repeat || ["Control", "Meta", "Alt", "Shift"].includes(event.key)) {
    return;
  }
  if (
    disabled ||
    (editing(event.target) && !(event.ctrlKey || event.metaKey || event.altKey)) ||
    dialogOwnsKeys()
  ) {
    sequence.reset();
    return;
  }
  dispatch(event);
}
function dispatch(event: KeyboardEvent): void {
  const bindings = shortcutCommands
    .filter((command) => command.group === "Settings")
    .flatMap((command) =>
      bindingsFor(shortcuts, command).map((binding) => ({
        id: command.id,
        strokes: shortcutStrokes(binding, command.gesture),
      })),
    );
  const next = sequence.next(event, bindings);
  if (!next) {
    return;
  }
  event.preventDefault();
  if (!next.complete) {
    return;
  }
  if (next.id === "shortcutKeyboard") {
    onopen("keybindings");
  } else {
    onopen("preferences");
  }
}
onMount(() => {
  const stopWatching = watchSequence(sequence);
  globalThis.addEventListener("keydown", key);
  return () => {
    stopWatching();
    globalThis.removeEventListener("keydown", key);
  };
});
</script>
