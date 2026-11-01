import {
  bindingsFor,
  type ShortcutCommand,
  shortcutCommands,
  shortcutStrokes,
} from "./shortcut-commands.ts";

const modifiers = ["Mod", "Ctrl", "Meta", "Alt", "Shift"];
const functionKeyPattern = /^F(?:[1-9]|1\d|2[0-4])$/u;
const characterPattern = /^[\p{L}\p{N}\p{P}\p{S}]$/u;
const symbolPattern = /^[^\p{L}\p{N}\s]$/u;
const navigationPattern = /^(?:Arrow|Home|End|Page)/u;
const browserLetterPattern = /^[ACDFIJLNOPQRSTVWXYZ]$/u;
const namedKeys = [
  "Plus",
  "Space",
  "Escape",
  "Delete",
  "Backspace",
  "Insert",
  "Home",
  "End",
  "PageUp",
  "PageDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Enter",
  "Tab",
];
type KeyEvent = Pick<
  KeyboardEvent,
  "key" | "ctrlKey" | "metaKey" | "altKey" | "shiftKey" | "isComposing"
>;

function keyName(key: string): string {
  if (key === "+") {
    return "Plus";
  }
  if (key === " ") {
    return "Space";
  }
  if (characterPattern.test(key)) {
    return key.toUpperCase();
  }
  return key;
}
function validKey(key: string): boolean {
  return (
    namedKeys.includes(key) ||
    functionKeyPattern.test(key) ||
    (characterPattern.test(key) && key !== "+" && key.toUpperCase() === key)
  );
}
function validStroke(stroke: string): boolean {
  const parts = stroke.split("+");
  const key = parts.pop() ?? "";
  return (
    validKey(key) &&
    new Set(parts).size === parts.length &&
    parts.every((part) => modifiers.includes(part)) &&
    modifiers.filter((part) => parts.includes(part)).join("+") === parts.join("+") &&
    !(symbolKey(key) && parts.includes("Shift")) &&
    !(parts.includes("Mod") && (parts.includes("Ctrl") || parts.includes("Meta")))
  );
}
function strokeFromEvent(event: KeyEvent): string | null {
  const key = keyName(event.key);
  if (event.isComposing || !validKey(key)) {
    return null;
  }
  const parts: string[] = [];
  if (event.ctrlKey) {
    parts.push("Ctrl");
  }
  if (event.metaKey) {
    parts.push("Meta");
  }
  if (event.altKey) {
    parts.push("Alt");
  }
  if (event.shiftKey && !symbolKey(key)) {
    parts.push("Shift");
  }
  return [...parts, key].join("+");
}
function symbolKey(key: string): boolean {
  return key === "Plus" || symbolPattern.test(key);
}
function matchesStroke(event: KeyEvent, stroke: string): boolean {
  if (!stroke || event.isComposing) {
    return false;
  }
  const parts = stroke.split("+");
  const key = parts.pop();
  const primary = parts.includes("Mod");
  let primaryMatches =
    event.ctrlKey === parts.includes("Ctrl") && event.metaKey === parts.includes("Meta");
  if (primary) {
    primaryMatches = event.ctrlKey !== event.metaKey;
  }
  return (
    keyName(event.key) === key &&
    primaryMatches &&
    event.altKey === parts.includes("Alt") &&
    (symbolKey(key ?? "") || event.shiftKey === parts.includes("Shift"))
  );
}
function expanded(stroke: string): string[] {
  if (stroke.startsWith("Mod+")) {
    return [stroke.replace("Mod+", "Ctrl+"), stroke.replace("Mod+", "Meta+")];
  }
  return [stroke];
}
function overlaps(a: string[], b: string[]): boolean {
  return a
    .slice(0, Math.min(a.length, b.length))
    .every((stroke, index) =>
      expanded(stroke).some((variant) => expanded(b[index] ?? "").includes(variant)),
    );
}
function reserved(stroke: string, command: ShortcutCommand, continuation: boolean): boolean {
  const parts = stroke.split("+");
  const key = parts.pop() ?? "";
  if (key === "Tab" || key === "Space") {
    return true;
  }
  const global = command.context.some((context) => context === "Global");
  if (key === "Enter" && parts.length === 0) {
    return !command.context.some(
      (context) => context === "Combobox" || context === "Calculator form",
    );
  }
  if (key === "Escape") {
    return global && (command.gesture !== "double" || parts.length > 0);
  }
  if (global && navigationPattern.test(key) && parts.length === 0) {
    return true;
  }
  if (["F1", "F3", "F5", "F6", "F7", "F11", "F12"].includes(key)) {
    return true;
  }
  if (parts.includes("Alt") && (key === "F4" || key.startsWith("Arrow"))) {
    return true;
  }
  return (
    !continuation &&
    parts.some((part) => ["Mod", "Ctrl", "Meta"].includes(part)) &&
    !parts.includes("Alt") &&
    browserLetterPattern.test(key)
  );
}
function bindingError(
  command: ShortcutCommand,
  binding: string,
  fields: Record<string, string>,
  bindingIndex: number | null = 0,
): string | null {
  const strokes = binding.split(" ");
  const maximum = 2;
  if (strokes.length > maximum || !strokes.every(validStroke)) {
    return "Record a valid key combination.";
  }
  // The default Settings chord deliberately consumes Ctrl/Meta+S only after its prefix.
  if (
    binding !== command.keys &&
    strokes.some((stroke, index) => reserved(stroke, command, index > 0))
  ) {
    return "This combination is reserved for browser, text editing or standard navigation.";
  }
  const conflict = shortcutCommands.find(
    (other) =>
      command.context.some((context) =>
        other.context.some((otherContext) => otherContext === context),
      ) &&
      bindingsFor(fields, other).some(
        (current, index) =>
          (other.id !== command.id || index !== bindingIndex) &&
          overlaps(
            shortcutStrokes(binding, command.gesture),
            shortcutStrokes(current, other.gesture),
          ),
      ),
  );
  if (conflict) {
    if (conflict.id === command.id) {
      return "Conflicts with another binding for this action.";
    }
    return `Conflicts with “${conflict.action}” in ${conflict.context.join(" or ")}. Change or remove that shortcut first.`;
  }
  return null;
}
function validateShortcuts(fields: Record<string, string>): void {
  for (const command of shortcutCommands) {
    for (const [index, binding] of bindingsFor(fields, command).entries()) {
      const error = bindingError(command, binding, fields, index);
      if (error) {
        throw new Error(`${command.action}: ${error}`);
      }
    }
  }
}
function displayStroke(stroke: string): string {
  return stroke
    .replace("Mod+", "Ctrl/⌘+")
    .replace("Meta+", "⌘+")
    .replace("Plus", "+")
    .replace("Space", "Space");
}

export { bindingError, displayStroke, matchesStroke, strokeFromEvent, validateShortcuts };
