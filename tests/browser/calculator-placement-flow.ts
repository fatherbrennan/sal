import assert from "node:assert/strict";
import type { Page } from "playwright";
import { readUiState } from "../../src/lib/ui-state.ts";
import { storedRecords, uiStateData } from "./ui-state-storage.ts";

const topRight = { x: 1160, y: 140 };
const bottomLeft = { x: 20, y: 780 };

async function calculatorPlacementFlow(page: Page, artifact: string): Promise<void> {
  const original = JSON.stringify(await storedRecords(page));
  const panel = page.getByRole("complementary", { name: "Quick calculator" });
  const toggle = page.locator("header").getByRole("button", { name: "Calculator", exact: true });
  assert((await toggle.textContent())?.trim() === "🖩", "The header toggle must show only 🖩");
  assert((await toggle.getAttribute("aria-pressed")) === "true");
  assert((await toggle.getAttribute("aria-controls")) === "quick-calculator");
  await toggle.hover();
  const hideTip = page.getByRole("tooltip").filter({ hasText: "Hide calculator" });
  await hideTip.waitFor();
  await page.screenshot({ path: `${artifact}-hide-tooltip.png` });
  await toggle.press("Escape");
  await hideTip.waitFor({ state: "hidden" });
  assert(await panel.isVisible(), "Dismissing the tooltip must not hide the calculator");
  await toggle.click();
  await panel.waitFor({ state: "hidden" });
  assert((await toggle.getAttribute("aria-pressed")) === "false");
  await page.keyboard.press("+");
  assert((await page.locator(".highlight-layer:popover-open").count()) === 0);
  assert(readUiState(await uiStateData(page), []).calculator.visible === false);
  await page.reload();
  await toggle.focus();
  await page.getByRole("tooltip").filter({ hasText: "Show calculator" }).waitFor();
  await page.screenshot({ path: `${artifact}-show-tooltip.png` });
  await toggle.press("Space");
  await panel.waitFor();
  assert((await toggle.textContent())?.trim() === "🖩");
  assert((await toggle.getAttribute("aria-pressed")) === "true");
  assert((await panel.getByLabel("Calculator total").textContent())?.trim() === "0");
  await choosePositions(page, artifact);
  await dragTo(page, topRight, "Top right", artifact);
  await aligned(page, "Top right");
  assert(readUiState(await uiStateData(page), []).calculator.position === "top-right");
  await page.screenshot({ path: `${artifact}-top-right.png` });
  await reloadAndResize(page);
  await cancelledDrag(page);
  await aligned(page, "Top right");
  assert(readUiState(await uiStateData(page), []).calculator.position === "top-right");
  await dragTo(page, bottomLeft, "Bottom left", artifact);
  await aligned(page, "Bottom left");
  assert(readUiState(await uiStateData(page), []).calculator.position === "bottom-left");
  await page.reload();
  await panel.waitFor();
  await aligned(page, "Bottom left");
  assert(
    JSON.stringify(await storedRecords(page)) === original,
    "Placement must not change offers or settings",
  );
}

async function choosePositions(page: Page, artifact: string): Promise<void> {
  const panel = page.getByRole("complementary", { name: "Quick calculator" });
  const move = panel.getByRole("button", { name: "Move calculator", exact: true });
  await move.focus();
  await move.press("Enter");
  const choices = page.getByRole("group", { name: "Calculator position", exact: true });
  const gridBounds = await choices.boundingBox();
  const viewport = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    height: innerHeight,
  }));
  assert(
    gridBounds &&
      gridBounds.x === 0 &&
      gridBounds.y === 0 &&
      gridBounds.width === viewport.width &&
      gridBounds.height === viewport.height,
    "The snap guide must cover the screen",
  );
  await gridAppearance(page, artifact);
  await page.keyboard.press("Escape");
  await choices.waitFor({ state: "hidden" });
  assert(await move.evaluate((element) => element === document.activeElement));
  const positions = [
    "Top left",
    "Top centre",
    "Top right",
    "Middle left",
    "Centre",
    "Middle right",
    "Bottom left",
    "Bottom centre",
    "Bottom right",
  ];
  await positions.reduce(async (previous, label) => {
    await previous;
    await move.click();
    const choice = choices.getByRole("button", { name: label, exact: true });
    const bounds = await choice.boundingBox();
    assert(bounds);
    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    await choice.click();
    await choices.waitFor({ state: "hidden" });
    await aligned(page, label);
    await previewFits(page);
  }, Promise.resolve());
  await move.press("Enter");
  await choices.getByRole("button", { name: "Centre", exact: true }).focus();
  await page.keyboard.press("Enter");
  await aligned(page, "Centre");
  await choices.waitFor({ state: "hidden" });
}

async function previewFits(page: Page): Promise<void> {
  await page.keyboard.down("+");
  await page.waitForFunction(() => {
    const preview = document
      .querySelector(".highlight-layer:popover-open .preview")
      ?.getBoundingClientRect();
    const panel = document.querySelector("aside[data-calculator]")?.getBoundingClientRect();
    return (
      preview &&
      panel &&
      preview.top >= 0 &&
      preview.bottom <= innerHeight &&
      preview.left >= 0 &&
      preview.right <= document.documentElement.clientWidth &&
      (preview.bottom < panel.top || preview.top > panel.bottom)
    );
  });
  await page.keyboard.up("+");
}

async function gridAppearance(page: Page, artifact: string): Promise<void> {
  const original = await page.locator("html").getAttribute("data-appearance");
  await page.evaluate(() => document.documentElement.setAttribute("data-appearance", "light"));
  await page.screenshot({ path: `${artifact}-snap-grid.png` });
  await page.evaluate(() => document.documentElement.setAttribute("data-appearance", "dark"));
  await page.screenshot({ path: `${artifact}-snap-grid-dark.png` });
  await page.evaluate((appearance) => {
    if (appearance === null) {
      document.documentElement.removeAttribute("data-appearance");
    } else {
      document.documentElement.setAttribute("data-appearance", appearance);
    }
  }, original);
  await page.getByRole("button", { name: "Cancel placement", exact: true }).focus();
  await page.keyboard.press("Tab");
  assert(
    await page
      .getByRole("button", { name: "Top left", exact: true })
      .evaluate((element) => element === document.activeElement),
    "Tab must cycle to the first destination",
  );
  await page.keyboard.press("Shift+Tab");
  assert(
    await page
      .getByRole("button", { name: "Cancel placement", exact: true })
      .evaluate((element) => element === document.activeElement),
    "Shift+Tab must cycle to Cancel placement",
  );
}

async function reloadAndResize(page: Page): Promise<void> {
  const panel = page.getByRole("complementary", { name: "Quick calculator" });
  await page.reload();
  await panel.waitFor();
  await aligned(page, "Top right");
  await page.setViewportSize({ width: 640, height: 420 });
  await aligned(page, "Top right");
  await panel.getByRole("button", { name: "Calculator", exact: true }).click();
  await aligned(page, "Top right");
  const operand = panel.getByRole("textbox", { name: "Calculator number" });
  await operand.fill("42");
  await operand.press("Enter");
  const hide = panel.getByRole("button", { name: "Hide calculator", exact: true });
  assert((await hide.textContent())?.trim() === "✕");
  await hide.focus();
  await page.getByRole("tooltip").filter({ hasText: "Hide calculator" }).waitFor();
  await hide.press("Enter");
  const toggle = page.locator("header").getByRole("button", { name: "Calculator", exact: true });
  assert(await toggle.evaluate((element) => element === document.activeElement));
  await toggle.press("Enter");
  assert((await panel.getByLabel("Calculator total").textContent())?.trim() === "42");
  await page.setViewportSize({ width: 1280, height: 800 });
  await panel.getByRole("button", { name: "Calculator", exact: true }).click();
}

async function aligned(page: Page, label: string): Promise<void> {
  await page.waitForFunction((position) => {
    const rect = document.querySelector("aside[data-calculator]")?.getBoundingClientRect();
    if (!rect) {
      return false;
    }
    const tolerance = 2;
    const margin = 12;
    const width = document.documentElement.clientWidth;
    let x = rect.left + rect.width / 2 - width / 2;
    let y = rect.top + rect.height / 2 - innerHeight / 2;
    if (position.includes("left")) {
      x = rect.left - margin;
    } else if (position.includes("right")) {
      x = width - rect.right - margin;
    }
    if (position.startsWith("Top")) {
      y = rect.top - margin;
    } else if (position.startsWith("Bottom")) {
      y = innerHeight - rect.bottom - margin;
    }
    return Math.abs(x) < tolerance && Math.abs(y) < tolerance;
  }, label);
}

async function dragTo(
  page: Page,
  point: { x: number; y: number },
  position: string,
  artifact: string,
): Promise<void> {
  const handle = page.getByRole("button", { name: "Move calculator", exact: true });
  const rect = await handle.boundingBox();
  assert(rect);
  await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
  await page.mouse.down();
  await page.mouse.move(point.x, point.y, { steps: 8 });
  const grid = page.getByRole("group", { name: "Calculator position", exact: true });
  await grid.waitFor();
  assert(
    (await grid
      .getByRole("button", { name: position, exact: true })
      .getAttribute("data-target")) === "true",
  );
  const landing = await page.locator(".landing-preview").boundingBox();
  assert(landing);
  await page.screenshot({ path: `${artifact}-drag-${position}.png` });
  await page.mouse.up();
  await grid.waitFor({ state: "hidden" });
  const placed = await page.getByRole("complementary", { name: "Quick calculator" }).boundingBox();
  assert(
    placed && Math.abs(landing.x - placed.x) < 1 && Math.abs(landing.y - placed.y) < 1,
    "The landing preview must match the saved snap position",
  );
}

async function cancelledDrag(page: Page): Promise<void> {
  const handle = page.getByRole("button", { name: "Move calculator", exact: true });
  const rect = await handle.boundingBox();
  assert(rect);
  await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
  await page.mouse.down();
  await page.mouse.move(bottomLeft.x, bottomLeft.y, { steps: 8 });
  await page.keyboard.press("Escape");
  await page.mouse.up();
}

async function calculatorOfflineFlow(page: Page): Promise<void> {
  await page
    .getByText("Offline assets ready. This app can reopen without internet.", { exact: true })
    .waitFor({ state: "attached" });
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await page.locator("header").getByRole("button", { name: "Calculator", exact: true }).click();
  assert(readUiState(await uiStateData(page), []).calculator.visible === false);
  await page.context().setOffline(true);
  try {
    await page.reload();
    await page.locator("header").getByRole("button", { name: "Calculator", exact: true }).click();
    await aligned(page, "Bottom left");
  } finally {
    await page.context().setOffline(false);
  }
}

export { calculatorOfflineFlow, calculatorPlacementFlow };
