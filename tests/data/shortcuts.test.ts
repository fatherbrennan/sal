import { expect, it } from "bun:test";
import { newRecord, readBackup, readRecord, ruleVersion } from "../../src/lib/data/schema.ts";
import { editorSections } from "../../src/lib/fields/editor.ts";
import {
  bindingError,
  displayStroke,
  matchesStroke,
  strokeFromEvent,
  validateShortcuts,
} from "../../src/lib/shortcut-binding.ts";
import { bindingsFor, type ShortcutId, shortcutCommands } from "../../src/lib/shortcut-commands.ts";

const now = "2026-10-28T00:00:00.000Z";
const applicationCommandCount = 8;
function command(id: ShortcutId) {
  const found = shortcutCommands.find((entry) => entry.id === id);
  if (!found) {
    throw new Error("Missing command");
  }
  return found;
}
const key = (value: string, overrides = {}) => ({
  key: value,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  shiftKey: false,
  isComposing: false,
  ...overrides,
});

it("retains all eight global defaults and distinguishes disabled from inherited bindings", () => {
  expect(
    shortcutCommands.filter((entry) => entry.context.some((context) => context === "Global")),
  ).toHaveLength(applicationCommandCount);
  expect(() => validateShortcuts({})).not.toThrow();
  expect(bindingsFor({}, command("shortcutAdd"))).toEqual(["Plus"]);
  expect(bindingsFor({ shortcutAdd: "" }, command("shortcutAdd"))).toEqual([]);
  expect(bindingsFor({ shortcutAdd: "Alt+A" }, command("shortcutAdd"))).toEqual(["Alt+A"]);
  expect(bindingsFor({ shortcutAdd: "Plus\nAlt+A" }, command("shortcutAdd"))).toEqual([
    "Plus",
    "Alt+A",
  ]);
});

it("accepts the same shortcut in separate control contexts and preserves backup overrides", () => {
  const preferences = newRecord("preferences", "preferences", now);
  preferences.fields = {
    ...preferences.fields,
    shortcutPreferences: "Alt+J",
    shortcutInspectorClose: ["Escape", "Alt+J"].join("\n"),
    shortcutComboPrevious: ["ArrowUp", "Alt+J"].join("\n"),
    shortcutScrollLeft: ["ArrowLeft", "Alt+J"].join("\n"),
    shortcutWidthClose: "Alt+J",
  };
  expect(readRecord(preferences).fields).toEqual(preferences.fields);
  const backup = readBackup({
    schemaVersion: 1,
    ruleVersion,
    exportedAt: now,
    records: [preferences],
  });
  expect(backup.records[0]?.fields).toEqual(preferences.fields);
});

it("rejects duplicate and prefix bindings only within a shared context", () => {
  const preferences = newRecord("preferences", "preferences", now);
  const fields = {
    ...preferences.fields,
    shortcutComboPrevious: "Alt+J",
    shortcutComboNext: "Alt+J",
  };
  expect(() => readRecord({ ...preferences, fields })).toThrow("Combobox");
  expect(() =>
    readRecord({
      ...preferences,
      fields: {
        ...fields,
        shortcutComboNext: "Alt+J Alt+K",
      },
    }),
  ).toThrow("Combobox");
  expect(() =>
    readRecord({
      ...preferences,
      fields: {
        ...fields,
        shortcutComboNext: "ArrowDown",
        shortcutComboPrevious: "ArrowDown",
      },
    }),
  ).toThrow("Combobox");
});
it("records symbols, letters and modifiers without confusing Shift-produced symbols", () => {
  expect(strokeFromEvent(key("+", { shiftKey: true }))).toBe("Plus");
  expect(strokeFromEvent(key("*", { shiftKey: true }))).toBe("*");
  expect(strokeFromEvent(key("a", { ctrlKey: true, altKey: true, shiftKey: true }))).toBe(
    ["Ctrl", "Alt", "Shift", "A"].join("+"),
  );
  expect(strokeFromEvent(key("F8", { metaKey: true }))).toBe("Meta+F8");
  expect(strokeFromEvent(key(" "))).toBe("Space");
  expect(strokeFromEvent(key("é"))).toBe("É");
  for (const value of ["Shift", "Control", "Dead", "Unidentified"]) {
    expect(strokeFromEvent(key(value))).toBeNull();
  }
  expect(strokeFromEvent(key("a", { isComposing: true }))).toBeNull();
});
it("matches current modifiers, both primary modifiers and numpad-equivalent symbols", () => {
  expect(matchesStroke(key("+", { shiftKey: true }), "Plus")).toBe(true);
  expect(matchesStroke(key("+"), "Plus")).toBe(true);
  expect(matchesStroke(key("a", { altKey: true }), "Alt+A")).toBe(true);
  expect(matchesStroke(key("a"), "Alt+A")).toBe(false);
  expect(matchesStroke(key("a", { shiftKey: true }), "A")).toBe(false);
  expect(matchesStroke(key(",", { ctrlKey: true }), "Mod+,")).toBe(true);
  expect(matchesStroke(key(",", { metaKey: true }), "Mod+,")).toBe(true);
  expect(matchesStroke(key(",", { ctrlKey: true, metaKey: true }), "Mod+,")).toBe(false);
  expect(matchesStroke(key("+", { ctrlKey: true }), "Plus")).toBe(false);
  expect(matchesStroke(key("+", { isComposing: true }), "Plus")).toBe(false);
  expect(matchesStroke(key("+"), "")).toBe(false);
});
it("rejects duplicate bindings and prefix conflicts across Ctrl and Command variants", () => {
  expect(bindingError(command("shortcutAdd"), "-", {})).toContain("Subtract clicked value");
  expect(bindingError(command("shortcutAdd"), "Ctrl+K", {})).toContain("Open Keyboard shortcuts");
  expect(bindingError(command("shortcutAdd"), "Meta+K", {})).toContain("Open Keyboard shortcuts");
  expect(
    bindingError(command("shortcutPreferences"), "Alt+G Alt+H", { shortcutAdd: "Alt+G" }),
  ).toContain("Add clicked value");
  expect(bindingError(command("shortcutAdd"), "-", { shortcutSubtract: "" })).toBeNull();
  expect(bindingError(command("shortcutPreferences"), "Ctrl+K Ctrl+B", {})).toBeNull();
});
it("rejects malformed, noncanonical and reserved bindings at the storage boundary", () => {
  for (const binding of [
    "Ctrl",
    "Ctrl+",
    "Ctrl++A",
    "Alt+Ctrl+A",
    "Ctrl+Ctrl+A",
    "Mod+Ctrl+B",
    "Shift+Plus",
    "a",
    "A B C",
    "Tab",
    "Enter",
    "Space",
    "Escape",
    "ArrowLeft",
    "F5",
    "Alt+F4",
    "Ctrl+L",
    "Ctrl+C",
    "F25",
    "é",
    "\u0000",
  ]) {
    expect(bindingError(command("shortcutAdd"), binding, {})).not.toBeNull();
  }
  expect(bindingError(command("shortcutPreferences"), "A B C", {})).not.toBeNull();
  expect(bindingError(command("shortcutPreferences"), "Ctrl+K Ctrl+S", {})).toContain(
    "Open Keyboard shortcuts",
  );
  expect(bindingError(command("shortcutClear"), "Escape", {})).toBeNull();
  expect(bindingError(command("shortcutUndo"), "F8", {})).toBeNull();
  expect(displayStroke("Mod+Plus")).toBe("Ctrl/⌘++");
});
it("validates shortcut imports and preserves unrelated preferences without exposing raw fields", () => {
  const preferences = newRecord("preferences", "preferences", now);
  preferences.fields = {
    ...preferences.fields,
    appearance: "dark",
    shortcutAdd: "Alt+A",
    shortcutSubtract: "",
  };
  const imported = readBackup({
    schemaVersion: 1,
    ruleVersion,
    exportedAt: now,
    records: [preferences],
  });
  expect(imported.records[0]?.fields).toMatchObject({
    appearance: "dark",
    shortcutAdd: "Alt+A",
    shortcutSubtract: "",
  });
  expect(
    editorSections(preferences).some((section) => section.title === "Keyboard shortcuts"),
  ).toBe(false);
  expect(() =>
    readRecord({ ...preferences, fields: { ...preferences.fields, shortcutMultiply: "Alt+A" } }),
  ).toThrow("Conflicts");
  expect(() =>
    readRecord({ ...preferences, fields: { ...preferences.fields, shortcutAdd: "Ctrl+L" } }),
  ).toThrow("reserved");
  expect(() =>
    readRecord({ ...preferences, fields: { ...preferences.fields, shortcutFake: "A" } }),
  ).toThrow();
});

it("preserves multiple shortcut bindings in records and backup round trips", () => {
  const preferences = newRecord("preferences", "preferences", now);
  preferences.fields = {
    ...preferences.fields,
    shortcutAdd: "Plus\nAlt+A",
    shortcutPreferences: "Mod+,\nAlt+G Alt+H\nAlt+G Alt+J",
  };
  expect(readRecord(preferences).fields).toEqual(preferences.fields);
  const backup = readBackup(
    JSON.parse(
      JSON.stringify({
        schemaVersion: 1,
        ruleVersion,
        exportedAt: now,
        records: [preferences],
      }),
    ),
  );
  expect(backup.records[0]?.fields).toEqual(preferences.fields);
});

it("rejects empty, malformed and overlapping shortcut alternatives", () => {
  for (const bindings of [
    ["Alt+A", "Alt+A"],
    ["Mod+,", "Ctrl+,"],
    ["Alt+A", "Alt+A Alt+B"],
    ["Alt+A", ""],
    ["", "Alt+A"],
    ["Alt+A", "", "Alt+B"],
    ["Alt+A\r", "Alt+B"],
    ["Alt+A", "Ctrl+L"],
  ]) {
    expect(() => validateShortcuts({ shortcutPreferences: bindings.join("\n") })).toThrow();
  }
  expect(() =>
    validateShortcuts({
      shortcutAdd: "Plus\nAlt+A",
      shortcutSubtract: "-\nAlt+A",
    }),
  ).toThrow("Conflicts");
});

it("validates shortcut additions against siblings while allowing the edited binding", () => {
  const add = command("shortcutAdd");
  const fields = { shortcutAdd: "Plus\nAlt+A" };
  expect(bindingError(add, "Alt+A", fields, null)).toContain("another binding");
  expect(bindingError(add, "Alt+A", fields, 1)).toBeNull();
  expect(bindingError(add, "Plus", fields, 1)).toContain("another binding");
  expect(bindingError(add, "Alt+B", fields, null)).toBeNull();
  expect(bindingError(add, "", fields, null)).not.toBeNull();
});

it("accepts two-step calculator bindings and preserves them in backups", () => {
  const preferences = newRecord("preferences", "preferences", now);
  preferences.fields = {
    ...preferences.fields,
    shortcutAdd: "Plus\nCtrl+K Ctrl+A",
    shortcutSubtract: "-\nCtrl+K Ctrl+B",
    shortcutMultiply: "*\nCtrl+K Ctrl+M",
    shortcutDivide: "/\nCtrl+K Ctrl+D",
    shortcutUndo: "Delete\nCtrl+K Ctrl+U",
    shortcutClear: ["Escape", "Ctrl+K Ctrl+C"].join("\n"),
  };
  expect(readRecord(preferences).fields).toEqual(preferences.fields);
  expect(
    readBackup({ schemaVersion: 1, ruleVersion, exportedAt: now, records: [preferences] })
      .records[0]?.fields,
  ).toEqual(preferences.fields);
  for (const action of shortcutCommands.filter((entry) => entry.group === "Calculator")) {
    expect(bindingError(action, "Alt+G Alt+H", {}, null)).toBeNull();
    expect(bindingError(action, "Alt+G Alt+H Alt+J", {}, null)).not.toBeNull();
    expect(bindingError(action, "Alt+G Tab", {}, null)).toContain("reserved");
  }
});

it("compares calculator conflicts using the steps that actually execute", () => {
  expect(bindingError(command("shortcutUndo"), "Delete Delete", {}, null)).toContain(
    "another binding",
  );
  expect(bindingError(command("shortcutClear"), "Delete Delete", {}, null)).toContain(
    "Undo the last calculator operation",
  );
  expect(bindingError(command("shortcutUndo"), "Delete Alt+U", {}, null)).toBeNull();
  expect(bindingError(command("shortcutAdd"), "Delete", {}, null)).toContain("Undo");
});
