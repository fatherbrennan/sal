import { getContext, onMount, setContext } from "svelte";
import { controlShortcutCommands } from "./control-shortcut-commands.ts";
import { matchesStroke } from "./shortcut-binding.ts";
import {
  bindingsFor,
  type ShortcutContext,
  type ShortcutId,
  shortcutStrokes,
} from "./shortcut-commands.ts";
import { isSequencePrefix, ShortcutSequence } from "./shortcut-sequence.ts";
import { watchSequence } from "./shortcut-sequence-events.ts";

const contextKey = Symbol("sal-control-shortcuts");
type ControlId = (typeof controlShortcutCommands)[number]["id"];
type ControlKey = Parameters<ShortcutSequence["next"]>[0] & Pick<KeyboardEvent, "preventDefault">;

class ControlShortcuts {
  private readonly fields: () => Record<string, string>;
  private readonly sequences: Map<ShortcutContext, ShortcutSequence>;

  constructor(fields: () => Record<string, string>) {
    this.fields = fields;
    this.sequences = new Map(
      controlShortcutCommands.map((command) => {
        const [context] = command.context;
        return [context, new ShortcutSequence(context)];
      }),
    );
  }

  bindings(id: ControlId): string[] {
    const command = controlShortcutCommands.find((entry) => entry.id === id);
    if (command) {
      return bindingsFor(this.fields(), command);
    }
    return [];
  }

  watch(): () => void {
    const stops = [...this.sequences.values()].map(watchSequence);
    return () => {
      for (const stop of stops) {
        stop();
      }
    };
  }

  match(event: ControlKey, ids: readonly ControlId[]): ShortcutId | null {
    const commands = controlShortcutCommands.filter((command) => ids.includes(command.id));
    const context = commands[0]?.context[0];
    const sequence = context && this.sequences.get(context);
    if (!(sequence && context)) {
      return null;
    }
    if (
      (event.defaultPrevented && !isSequencePrefix(event)) ||
      event.isComposing ||
      event.getModifierState("AltGraph")
    ) {
      sequence.reset();
      return null;
    }
    const bindings = commands.flatMap((command) =>
      this.bindings(command.id).map((binding) => ({
        id: command.id,
        strokes: shortcutStrokes(binding, command.gesture),
      })),
    );
    if (event.repeat) {
      const repeated = bindings.find(
        ({ strokes }) => strokes.length === 1 && matchesStroke(event, strokes[0] ?? ""),
      );
      if (repeated) {
        event.preventDefault();
        return repeated.id;
      }
      return null;
    }
    const next = sequence.next(event, bindings);
    if (!next) {
      return null;
    }
    event.preventDefault();
    if (next.complete) {
      return next.id;
    }
    return null;
  }
}

function provideControlShortcuts(fields: () => Record<string, string>): void {
  const controls = setContext(contextKey, new ControlShortcuts(fields));
  onMount(() => controls.watch());
}

function controlShortcuts(): ControlShortcuts {
  const controls = getContext<ControlShortcuts | undefined>(contextKey);
  if (controls) {
    return controls;
  }
  const defaults = new ControlShortcuts(() => ({}));
  onMount(() => defaults.watch());
  return defaults;
}

export { ControlShortcuts, controlShortcuts, provideControlShortcuts };
