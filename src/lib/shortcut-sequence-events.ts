import type { ShortcutSequence } from "./shortcut-sequence.ts";

function watchSequence(sequence: ShortcutSequence): () => void {
  const disconnect = sequence.connect();
  const reset = () => sequence.reset();
  const observe = (event: KeyboardEvent) => sequence.observe(event);
  globalThis.addEventListener("keydown", observe, true);
  globalThis.addEventListener("pointerdown", reset, true);
  globalThis.addEventListener("blur", reset);
  document.addEventListener("focusin", reset);
  document.addEventListener("visibilitychange", reset);
  return () => {
    disconnect();
    globalThis.removeEventListener("keydown", observe, true);
    globalThis.removeEventListener("pointerdown", reset, true);
    globalThis.removeEventListener("blur", reset);
    document.removeEventListener("focusin", reset);
    document.removeEventListener("visibilitychange", reset);
  };
}

export { watchSequence };
