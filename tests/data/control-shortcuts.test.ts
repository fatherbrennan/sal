import { expect, it } from "bun:test";
import { ControlShortcuts } from "../../src/lib/control-shortcuts.ts";
import { ShortcutSequence } from "../../src/lib/shortcut-sequence.ts";

function key(value: string, overrides = {}) {
  const event = {
    key: value,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    shiftKey: false,
    isComposing: false,
    repeat: false,
    defaultPrevented: false,
    timeStamp: 1000,
    getModifierState: () => false,
    preventDefault() {
      event.defaultPrevented = true;
    },
    ...overrides,
  };
  return event;
}

it("runs each control shortcut only among the currently eligible actions", () => {
  const controls = new ControlShortcuts(() => ({}));
  for (const [id, stroke] of [
    ["shortcutCalculatorApply", "Enter"],
    ["shortcutComboPrevious", "ArrowUp"],
    ["shortcutComboNext", "ArrowDown"],
    ["shortcutComboSelect", "Enter"],
    ["shortcutComboClose", "Escape"],
    ["shortcutTooltipDismiss", "Escape"],
    ["shortcutInspectorClose", "Escape"],
    ["shortcutInspectorBack", "Backspace"],
    ["shortcutWidthClose", "Escape"],
    ["shortcutPlacementCancel", "Escape"],
    ["shortcutScrollLeft", "ArrowLeft"],
    ["shortcutScrollRight", "ArrowRight"],
    ["shortcutScrollFirst", "Home"],
    ["shortcutScrollLast", "End"],
  ] as const) {
    const event = key(stroke);
    expect(controls.match(event, [id])).toBe(id);
    expect(event.defaultPrevented).toBe(true);
    expect(controls.match(key(stroke), [])).toBeNull();
  }
});

it("updates control overrides immediately and preserves single-key repeats", () => {
  let fields = { shortcutComboNext: "Alt+J" };
  const controls = new ControlShortcuts(() => fields);
  expect(controls.match(key("ArrowDown"), ["shortcutComboNext"])).toBeNull();
  expect(controls.match(key("j", { altKey: true, repeat: true }), ["shortcutComboNext"])).toBe(
    "shortcutComboNext",
  );
  fields = { shortcutComboNext: "" };
  expect(controls.match(key("j", { altKey: true }), ["shortcutComboNext"])).toBeNull();
});

it("keeps control shortcut chains in their context and ignores consumed or composing keys", () => {
  const controls = new ControlShortcuts(() => ({ shortcutComboNext: "Alt+G Alt+J" }));
  const first = key("g", { altKey: true });
  expect(controls.match(first, ["shortcutComboNext"])).toBeNull();
  expect(first.defaultPrevented).toBe(true);
  expect(controls.match(first, ["shortcutInspectorClose"])).toBeNull();
  expect(
    controls.match(key("j", { altKey: true, repeat: true }), ["shortcutComboNext"]),
  ).toBeNull();
  expect(controls.match(key("j", { altKey: true }), ["shortcutComboNext"])).toBe(
    "shortcutComboNext",
  );
  for (const overrides of [
    { isComposing: true },
    { defaultPrevented: true },
    { getModifierState: () => true },
  ]) {
    expect(controls.match(key("Escape", overrides), ["shortcutInspectorClose"])).toBeNull();
  }
});

it("lets nested contexts share a chain prefix without triggering a containing single binding", () => {
  const controls = new ControlShortcuts(() => ({
    shortcutComboNext: "Alt+G Alt+N",
    shortcutInspectorClose: "Alt+G Alt+I",
  }));
  const navigation = new ShortcutSequence();
  const bindings = [{ id: "shortcutPreferences", strokes: ["Alt+G", "Alt+V"] }] as const;
  const available = bindings.map(({ id, strokes }) => ({ id, strokes: [...strokes] }));
  const first = key("g", { altKey: true });
  controls.match(first, ["shortcutComboNext"]);
  controls.match(first, ["shortcutInspectorClose"]);
  expect(navigation.next(first, available)).toEqual({ id: "shortcutPreferences", complete: false });
  expect(
    new ShortcutSequence().next(first, [{ id: "shortcutKeyboard", strokes: ["Alt+G"] }]),
  ).toBeNull();
  const inspectorKey = key("i", { altKey: true });
  expect(controls.match(inspectorKey, ["shortcutComboNext"])).toBeNull();
  expect(controls.match(inspectorKey, ["shortcutInspectorClose"])).toBe("shortcutInspectorClose");
  expect(navigation.next(inspectorKey, available)).toBeNull();
});
