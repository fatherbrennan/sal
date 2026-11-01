import { matchesStroke } from "./shortcut-binding.ts";
import type { ShortcutContext, ShortcutId } from "./shortcut-commands.ts";

const sequenceTimeoutMs = 1500;
const sequenceHelp =
  "Press each step in order within 1.5 seconds. Held-key repeats do not count. Another key, a click, a focus change or a handled control cancels the pending sequence. Modifier keys may stay held between steps.";
type SequenceKey = Pick<
  KeyboardEvent,
  | "key"
  | "ctrlKey"
  | "metaKey"
  | "altKey"
  | "shiftKey"
  | "isComposing"
  | "timeStamp"
  | "repeat"
  | "defaultPrevented"
  | "getModifierState"
>;
interface SequenceBinding {
  id: ShortcutId;
  strokes: string[];
}
const prefixes = new WeakSet<SequenceKey>();
const connected = new Set<ShortcutSequence>();

function isSequencePrefix(event: SequenceKey): boolean {
  return prefixes.has(event);
}

class ShortcutSequence {
  private prefix: SequenceKey | null;
  private handled: SequenceKey | null;
  private bindings: SequenceBinding[];
  private readonly context: ShortcutContext;

  constructor(context: ShortcutContext = "Global") {
    this.context = context;
    this.prefix = null;
    this.handled = null;
    this.bindings = [];
  }

  reset(): void {
    this.prefix = null;
    this.handled = null;
    this.bindings = [];
  }
  connect(): () => void {
    connected.add(this);
    return () => {
      this.reset();
      connected.delete(this);
    };
  }
  private completion(event: SequenceKey, bindings = this.bindings): SequenceBinding | undefined {
    const previous = this.prefix;
    return bindings.find(
      ({ strokes: [first = "", second] }) =>
        previous &&
        matchesStroke(previous, first) &&
        event.timeStamp - previous.timeStamp <= sequenceTimeoutMs &&
        second &&
        matchesStroke(event, second),
    );
  }
  observe(event: SequenceKey): void {
    queueMicrotask(() => {
      if (event.defaultPrevented && this.handled !== event && !isSequencePrefix(event)) {
        this.reset();
      }
    });
  }
  next(
    event: SequenceKey,
    bindings: SequenceBinding[],
  ): { id: ShortcutId; complete: boolean } | null {
    if (
      (event.defaultPrevented && !isSequencePrefix(event)) ||
      event.isComposing ||
      event.getModifierState("AltGraph")
    ) {
      this.reset();
      return null;
    }
    if (event.repeat || ["Control", "Meta", "Alt", "Shift"].includes(event.key)) {
      return null;
    }
    // A consumed prefix can start other chains, but cannot trigger their actions yet.
    const reservedPrefix = event.defaultPrevented;
    const completed = !reservedPrefix && this.completion(event, bindings);
    const continuingElsewhere = [...connected].some(
      (sequence) =>
        sequence !== this &&
        sequence.context === this.context &&
        sequence.completion(event) !== undefined,
    );
    this.reset();
    if (!completed && continuingElsewhere) {
      return null;
    }
    const next =
      completed ||
      bindings.find(
        ({ strokes }) =>
          (!reservedPrefix || strokes.length > 1) && matchesStroke(event, strokes[0] ?? ""),
      );
    if (!next) {
      return null;
    }
    const complete = Boolean(completed) || next.strokes.length === 1;
    if (!complete) {
      this.prefix = event;
      this.bindings = bindings;
      prefixes.add(event);
    }
    this.handled = event;
    return { id: next.id, complete };
  }
}

export { isSequencePrefix, ShortcutSequence, sequenceHelp };
