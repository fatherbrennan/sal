import { type CalculatorNumber, numericValue } from "./calculator.ts";

interface ValueRectangle {
  left: number;
  top: number;
  width: number;
  height: number;
}
interface PickedValue {
  value: CalculatorNumber;
  source: string;
  rectangles: ValueRectangle[];
}
type PickPoint = Pick<MouseEvent, "target" | "clientX" | "clientY">;

const numberTokens =
  /(?<![\w.,])[+−-]?\$?[+−-]?(?:\d[\d,]*(?:\.\d+)?|\.\d+)(?:e[+-]?\d+)?%?(?![\w.,])/giu;

function editing(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || target.matches("input, textarea, select"))
  );
}

function clickedValue(event: PickPoint): PickedValue | null {
  const { target } = event;
  if (!(target instanceof Element) || target.closest("[data-calculator]")) {
    return null;
  }
  if (target instanceof HTMLInputElement) {
    if (target.inputMode !== "decimal" && target.type !== "number") {
      return null;
    }
    return picked(target, target.value, [target.getBoundingClientRect()]);
  }
  if (editing(target)) {
    return null;
  }
  const explicit = explicitAtPoint(target, event);
  if (explicit) {
    return picked(explicit, explicit.getAttribute("data-calculator-value") ?? "", [
      explicit.getBoundingClientRect(),
    ]);
  }
  const range = document.createRange();
  range.selectNodeContents(target);
  const whole = picked(target, target.textContent ?? "", [...range.getClientRects()]);
  if (whole !== null) {
    return whole;
  }
  return textAtPoint(target, event);
}

function explicitAtPoint(target: Element, event: PickPoint): Element | null {
  const closest = target.closest("[data-calculator-value]");
  if (closest) {
    return closest;
  }
  const candidates = target.querySelectorAll("[data-calculator-value]");
  for (const candidate of candidates) {
    if (containsPoint(candidate.getBoundingClientRect(), event)) {
      return candidate;
    }
    if (candidates.length === 1 && target.textContent?.trim() === candidate.textContent?.trim()) {
      return candidate;
    }
  }
  return null;
}

function textAtPoint(target: Element, event: PickPoint): PickedValue | null {
  const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
    const text = node.textContent ?? "";
    const tokens = text.matchAll(numberTokens);
    for (const token of tokens) {
      const range = document.createRange();
      range.setStart(node, token.index);
      range.setEnd(node, token.index + token[0].length);
      if ([...range.getClientRects()].some((rect) => containsPoint(rect, event))) {
        return picked(target, token[0], [...range.getClientRects()]);
      }
    }
  }
  return null;
}

function containsPoint(rect: DOMRect, event: PickPoint): boolean {
  return (
    event.clientX >= rect.left &&
    event.clientX <= rect.right &&
    event.clientY >= rect.top &&
    event.clientY <= rect.bottom
  );
}

function picked(target: Element, text: string, rectangles: DOMRect[]): PickedValue | null {
  const value = numericValue(text);
  if (value === null) {
    return null;
  }
  return {
    value,
    source: sourceLabel(target),
    rectangles: rectangles
      .filter((rect) => rect.width > 0 && rect.height > 0)
      .map(({ left, top, width, height }) => ({ left, top, width, height })),
  };
}

function sourceLabel(target: Element): string {
  const explicit = target.closest("[data-calculator-label]")?.getAttribute("data-calculator-label");
  let label = explicit ?? "";
  if (!label && target instanceof HTMLInputElement) {
    label = [...(target.labels ?? [])].map((item) => item.textContent?.trim() ?? "").join(" · ");
  }
  label ||= target.closest("[aria-label]")?.getAttribute("aria-label") ?? "";
  label ||= "Page value";
  const context = target
    .closest("[data-calculator-context]")
    ?.getAttribute("data-calculator-context");
  if (context && !label.includes(context)) {
    return `${context}::${label}`;
  }
  return label;
}

export type { PickedValue };
export { clickedValue, editing };
