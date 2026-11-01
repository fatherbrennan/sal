import { controlShortcutCommands } from "./control-shortcut-commands.ts";

const applicationShortcutCommands = [
  {
    id: "shortcutPreferences",
    action: "Open Preferences",
    group: "Settings",
    keys: "Mod+,",
    gesture: "press",
    context: ["Global"],
    when: "App and local storage ready; no save/import or unresolved conflict; no modal dialog or dialog focus; inputs, selects and editable text require Ctrl/Command/Alt; pending valid edits saved before navigation.",
    description: "Open application preferences after pending edits are saved.",
  },
  {
    id: "shortcutKeyboard",
    action: "Open Keyboard shortcuts",
    group: "Settings",
    keys: "Mod+K Mod+S",
    gesture: "press",
    context: ["Global"],
    when: "App and local storage ready; no save/import or unresolved conflict; no modal dialog or dialog focus; inputs, selects and editable text require Ctrl/Command/Alt; pending valid edits saved before navigation.",
    description: "Open this editor after pending edits are saved.",
  },
  {
    id: "shortcutAdd",
    operator: "+",
    action: "Add clicked value",
    group: "Calculator",
    keys: "Plus",
    gesture: "hold",
    context: ["Global"],
    when: "Calculator visible; no drag or position chooser; primary click on a readable number outside Calculator, Keyboard shortcuts and Page width; held binding and click modifiers still match.",
    description:
      "Add the clicked number. Inspector values and numeric inputs are supported; ordinary text inputs, selects and editable text are excluded.",
  },
  {
    id: "shortcutSubtract",
    operator: "-",
    action: "Subtract clicked value",
    group: "Calculator",
    keys: "-",
    gesture: "hold",
    context: ["Global"],
    when: "Calculator visible; no drag or position chooser; primary click on a readable number outside Calculator, Keyboard shortcuts and Page width; held binding and click modifiers still match.",
    description:
      "Subtract the clicked number. Inspector values and numeric inputs are supported; ordinary text inputs, selects and editable text are excluded.",
  },
  {
    id: "shortcutMultiply",
    operator: "*",
    action: "Multiply by clicked value",
    group: "Calculator",
    keys: "*",
    gesture: "hold",
    context: ["Global"],
    when: "Calculator visible; no drag or position chooser; primary click on a readable number outside Calculator, Keyboard shortcuts and Page width; held binding and click modifiers still match.",
    description:
      "Multiply by the clicked number. Inspector values and numeric inputs are supported; ordinary text inputs, selects and editable text are excluded.",
  },
  {
    id: "shortcutDivide",
    operator: "/",
    action: "Divide by clicked value",
    group: "Calculator",
    keys: "/",
    gesture: "hold",
    context: ["Global"],
    when: "Calculator visible; no drag or position chooser; primary click on a readable number outside Calculator, Keyboard shortcuts and Page width; held binding and click modifiers still match.",
    description:
      "Divide by the clicked number. Inspector values and numeric inputs are supported; ordinary text inputs, selects and editable text are excluded. Zero leaves the total unchanged and shows an error.",
  },
  {
    id: "shortcutUndo",
    action: "Undo the last calculator operation",
    group: "Calculator",
    keys: "Delete",
    gesture: "double",
    context: ["Global"],
    when: "Calculator visible; no drag or position chooser; history exists; focus outside inputs, selects and editable text (including checkbox/radio inputs); no modal dialog or dialog focus.",
    description: "Remove the last operation and restore the previous total.",
  },
  {
    id: "shortcutClear",
    action: "Clear calculator history and entry",
    group: "Calculator",
    keys: "Escape",
    gesture: "double",
    context: ["Global"],
    when: "Calculator visible; no drag or position chooser; history, entry or error exists; focus outside inputs, selects and editable text (including checkbox/radio inputs); no modal dialog or dialog focus.",
    description: "Clear the calculator total, history and current entry.",
  },
] as const;
const shortcutCommands = [...applicationShortcutCommands, ...controlShortcutCommands];
type ShortcutCommand = (typeof shortcutCommands)[number];
type ShortcutId = ShortcutCommand["id"];
type ShortcutContext = ShortcutCommand["context"][number];

function bindingsFor(fields: Record<string, string>, command: ShortcutCommand): string[] {
  const value = fields[command.id] ?? command.keys;
  if (value === "") {
    return [];
  }
  // Newlines separate alternatives while preserving saved single-binding values.
  return value.split("\n");
}

function shortcutStrokes(value: string, gesture: ShortcutCommand["gesture"]): string[] {
  const keys = value.split(" ").filter(Boolean);
  if (gesture === "double" && keys.length === 1) {
    return [...keys, ...keys];
  }
  return keys;
}

export type { ShortcutCommand, ShortcutContext, ShortcutId };
export { bindingsFor, shortcutCommands, shortcutStrokes };
