import assert from "node:assert/strict";
import type { Locator } from "playwright";

export async function topLeftTooltip(trigger: Locator, text?: string): Promise<void> {
  const page = trigger.page();
  await trigger.focus();
  const tooltip = page.getByRole("tooltip");
  await tooltip.waitFor();
  const box = await tooltip.boundingBox();
  const viewport = page.viewportSize();
  const edge = 8;
  assert(box && viewport);
  assert(box.x === edge && box.y === edge, "Tooltip must stay at the viewport's top-left");
  assert(box.x + box.width <= viewport.width && box.y + box.height <= viewport.height);
  assert((await trigger.getAttribute("title")) === null, "No second native tooltip");
  assert((await trigger.getAttribute("aria-describedby")) === (await tooltip.getAttribute("id")));
  assert(text === undefined || (await tooltip.textContent())?.trim() === text);
  await trigger.press("Escape");
  await tooltip.waitFor({ state: "hidden" });
}
