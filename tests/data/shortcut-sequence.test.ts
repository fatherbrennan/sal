import { expect, it } from "bun:test";
import { shortcutStrokes } from "../../src/lib/shortcut-commands.ts";
import { ShortcutSequence } from "../../src/lib/shortcut-sequence.ts";

const cases = [
  { id: "shortcutKeyboard", strokes: ["Ctrl+K", "Ctrl+S"], first: "k", second: "s", ctrlKey: true },
  {
    id: "shortcutUndo",
    strokes: ["Delete", "Delete"],
    first: "Delete",
    second: "Delete",
    ctrlKey: false,
  },
  {
    id: "shortcutClear",
    strokes: ["Escape", "Escape"],
    first: "Escape",
    second: "Escape",
    ctrlKey: false,
  },
] as const;
const key = (value: string, timeStamp: number, overrides = {}) => ({
  key: value,
  timeStamp,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  shiftKey: false,
  isComposing: false,
  repeat: false,
  defaultPrevented: false,
  getModifierState: () => false,
  ...overrides,
});
const startTime = 1000;
const withinWindow = 2000;
const boundaryTime = 2500;
const expiredTime = 2501;

it.each([...cases])(
  "uses the same sequence window for $id",
  ({ id, strokes, first, second, ctrlKey }) => {
    const bindings = [{ id, strokes: [...strokes] }];
    const sequence = new ShortcutSequence();
    expect(sequence.next(key(first, startTime, { ctrlKey }), bindings)).toEqual({
      id,
      complete: false,
    });
    expect(sequence.next(key(second, withinWindow, { ctrlKey }), bindings)).toEqual({
      id,
      complete: true,
    });
    sequence.next(key(first, startTime, { ctrlKey }), bindings);
    expect(sequence.next(key(second, boundaryTime, { ctrlKey }), bindings)?.complete).toBe(true);
    sequence.next(key(first, startTime, { ctrlKey }), bindings);
    expect(sequence.next(key(second, expiredTime, { ctrlKey }), bindings)?.complete ?? false).toBe(
      false,
    );
  },
);

it.each([...cases])(
  "ignores repeats and modifier keys without extending $id",
  ({ id, strokes, first, second, ctrlKey }) => {
    const bindings = [{ id, strokes: [...strokes] }];
    const sequence = new ShortcutSequence();
    sequence.next(key(first, startTime, { ctrlKey }), bindings);
    expect(sequence.next(key(first, withinWindow, { ctrlKey, repeat: true }), bindings)).toBeNull();
    expect(sequence.next(key("Shift", withinWindow, { ctrlKey }), bindings)).toBeNull();
    expect(sequence.next(key(second, boundaryTime, { ctrlKey }), bindings)?.complete).toBe(true);
    sequence.next(key(first, startTime, { ctrlKey }), bindings);
    sequence.next(key(first, withinWindow, { ctrlKey, repeat: true }), bindings);
    expect(sequence.next(key(second, expiredTime, { ctrlKey }), bindings)?.complete ?? false).toBe(
      false,
    );
  },
);

it.each([...cases])(
  "cancels $id on another key, context reset, composition or a consumed key",
  ({ id, strokes, first, second, ctrlKey }) => {
    const bindings = [{ id, strokes: [...strokes] }];
    const sequence = new ShortcutSequence();
    for (const interruption of [
      key("q", startTime),
      key(first, startTime, { ctrlKey, isComposing: true }),
      key(first, startTime, { ctrlKey, defaultPrevented: true }),
      key(first, startTime, { ctrlKey, getModifierState: () => true }),
    ]) {
      sequence.reset();
      sequence.next(key(first, startTime, { ctrlKey }), bindings);
      expect(sequence.next(interruption, bindings)).toBeNull();
      expect(
        sequence.next(key(second, withinWindow, { ctrlKey }), bindings)?.complete ?? false,
      ).toBe(false);
    }
    sequence.next(key(first, startTime, { ctrlKey }), bindings);
    sequence.reset();
    expect(sequence.next(key(second, withinWindow, { ctrlKey }), bindings)?.complete ?? false).toBe(
      false,
    );
  },
);

it("prefers completing a sequence over starting another and shares the display expansion", () => {
  const sequence = new ShortcutSequence();
  const bindings = [
    { id: "shortcutPreferences", strokes: ["Alt+G", "Alt+H"] },
    { id: "shortcutKeyboard", strokes: ["Alt+J", "Alt+G"] },
  ] as const;
  const available = bindings.map(({ id, strokes }) => ({ id, strokes: [...strokes] }));
  sequence.next(key("j", startTime, { altKey: true }), available);
  expect(sequence.next(key("g", withinWindow, { altKey: true }), available)).toEqual({
    id: "shortcutKeyboard",
    complete: true,
  });
  expect(
    sequence.next(key(",", withinWindow, { ctrlKey: true }), [
      { id: "shortcutPreferences", strokes: ["Mod+,"] },
    ]),
  ).toEqual({ id: "shortcutPreferences", complete: true });
  expect(shortcutStrokes("Delete", "double")).toEqual(["Delete", "Delete"]);
  expect(shortcutStrokes("Ctrl+K Ctrl+U", "double")).toEqual(["Ctrl+K", "Ctrl+U"]);
  expect(shortcutStrokes("Ctrl+K Ctrl+A", "hold")).toEqual(["Ctrl+K", "Ctrl+A"]);
  expect(shortcutStrokes("Ctrl+K Ctrl+S", "press")).toEqual(["Ctrl+K", "Ctrl+S"]);
  expect(shortcutStrokes("", "double")).toEqual([]);
});

it("cancels keys consumed before bubbling but retains its own accepted prefix", async () => {
  const sequence = new ShortcutSequence();
  const bindings = [{ id: "shortcutClear", strokes: ["Escape", "Escape"] }] as const;
  const available = bindings.map(({ id, strokes }) => ({ id, strokes: [...strokes] }));
  const first = key("Escape", startTime);
  sequence.observe(first);
  sequence.next(first, available);
  first.defaultPrevented = true;
  await Promise.resolve();
  expect(sequence.next(key("Escape", withinWindow), available)?.complete).toBe(true);
  sequence.next(key("Escape", startTime), available);
  sequence.observe(key("Escape", withinWindow, { defaultPrevented: true }));
  await Promise.resolve();
  expect(sequence.next(key("Escape", withinWindow), available)?.complete).toBe(false);
});

it("shares a consumed prefix across calculator and settings sequences", async () => {
  const settings = new ShortcutSequence();
  const calculator = new ShortcutSequence();
  const disconnectSettings = settings.connect();
  const disconnectCalculator = calculator.connect();
  const settingsKeys = [{ id: "shortcutKeyboard", strokes: ["Ctrl+K", "Ctrl+S"] }] as const;
  const calculatorKeys = [{ id: "shortcutUndo", strokes: ["Ctrl+K", "Ctrl+U"] }] as const;
  const navigation = settingsKeys.map(({ id, strokes }) => ({ id, strokes: [...strokes] }));
  const undo = calculatorKeys.map(({ id, strokes }) => ({ id, strokes: [...strokes] }));
  try {
    const first = key("k", startTime, { ctrlKey: true });
    settings.observe(first);
    calculator.observe(first);
    expect(settings.next(first, navigation)).toEqual({ id: "shortcutKeyboard", complete: false });
    first.defaultPrevented = true;
    expect(calculator.next(first, undo)).toEqual({ id: "shortcutUndo", complete: false });
    await Promise.resolve();
    const second = key("u", withinWindow, { ctrlKey: true });
    expect(settings.next(second, navigation)).toBeNull();
    expect(calculator.next(second, undo)).toEqual({ id: "shortcutUndo", complete: true });
  } finally {
    disconnectSettings();
    disconnectCalculator();
  }
});

it("finishes a connected sequence before a different handler starts a single-key binding", () => {
  const settings = new ShortcutSequence();
  const calculator = new ShortcutSequence();
  const disconnectSettings = settings.connect();
  const disconnectCalculator = calculator.connect();
  const navigation = [{ id: "shortcutPreferences", strokes: ["Ctrl+,"] }] as const;
  const undo = [{ id: "shortcutUndo", strokes: ["Alt+G", "Ctrl+,"] }] as const;
  const settingsKeys = navigation.map(({ id, strokes }) => ({ id, strokes: [...strokes] }));
  const calculatorKeys = undo.map(({ id, strokes }) => ({ id, strokes: [...strokes] }));
  try {
    calculator.next(key("g", startTime, { altKey: true }), calculatorKeys);
    const second = key(",", withinWindow, { ctrlKey: true });
    expect(settings.next(second, settingsKeys)).toBeNull();
    expect(calculator.next(second, calculatorKeys)).toEqual({ id: "shortcutUndo", complete: true });
    calculator.next(key("g", startTime, { altKey: true }), calculatorKeys);
    disconnectCalculator();
    expect(settings.next(second, settingsKeys)).toEqual({
      id: "shortcutPreferences",
      complete: true,
    });
  } finally {
    disconnectSettings();
    disconnectCalculator();
  }
});
