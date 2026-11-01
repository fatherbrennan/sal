import { expect, it } from "bun:test";
import { ShortcutSequence } from "../../src/lib/shortcut-sequence.ts";
import { watchSequence } from "../../src/lib/shortcut-sequence-events.ts";

it("stubs document for watchSequence", () => {
  const listeners = new Map<string, Array<(event: unknown) => void>>();
  const documentStub = {
    addEventListener: (type: string, listener: (event: unknown) => void): void => {
      const list = listeners.get(type) ?? [];
      list.push(listener);
      listeners.set(type, list);
    },
    removeEventListener: (type: string, listener: (event: unknown) => void): void => {
      const list = listeners.get(type) ?? [];
      const index = list.indexOf(listener);
      if (index >= 0) {
        list.splice(index, 1);
      }
    },
  };
  Object.defineProperty(globalThis, "document", {
    value: documentStub,
    configurable: true,
    writable: true,
  });
  const sequence = new ShortcutSequence();
  const stop = watchSequence(sequence);
  expect(typeof stop).toBe("function");
  stop();
});
