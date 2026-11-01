import assert from "node:assert/strict";
import type { Page } from "playwright";
import { importFixture } from "../measurement/compare-flow.ts";
import { saveSettled } from "../measurement/edit-flow.ts";
import { amountButton } from "../measurement/inspector-flow.ts";

async function prepareCalculator(page: Page): Promise<void> {
  const calculator = page.getByRole("complementary", { name: "Quick calculator" });
  const toggle = calculator.getByRole("button", { name: "Calculator", exact: true });
  if ((await toggle.getAttribute("aria-expanded")) === "true") {
    await toggle.click();
  }
  await importFixture(page);
  await toggle.click();
  await calculator.getByRole("button", { name: "Clear", exact: true }).click();
  await calculator.getByRole("combobox").selectOption("+");
  await calculator.getByRole("textbox", { name: "Calculator number" }).fill("10");
  await calculator.getByRole("button", { name: "Apply", exact: true }).click();
}

async function shortcutContextFlow(page: Page): Promise<void> {
  await prepareCalculator(page);
  const total = page.getByLabel("Calculator total", { exact: true });
  assert((await total.textContent())?.trim() === "10");
  await page.getByRole("button", { name: "comparisons", exact: true }).click();
  await page.getByLabel("Saved comparison", { exact: true }).selectOption({ label: "Two offers" });
  await amountButton(page, "Cash after tax").click();
  const panel = page.getByRole("dialog", { name: "Calculation inspector" });
  await page.keyboard.press("Delete");
  await page.keyboard.press("Delete");
  assert((await total.textContent())?.trim() === "10");
  await page.keyboard.press("Control+,");
  assert(await panel.isVisible());
  assert((await page.getByRole("heading", { name: "Settings", exact: true }).count()) === 0);
  await panel.getByRole("heading", { name: "Calculation inspector", exact: true }).focus();
  await page.keyboard.press("Shift+Escape");
  assert(await panel.isVisible(), "Modified Escape does not close the inspector");
  await page.keyboard.press("Control+Escape");
  assert(await panel.isVisible(), "Modified Escape does not close the inspector");
  await page.keyboard.press("Tab");
  assert(await panel.evaluate((element) => element.contains(document.activeElement)));
  const search = panel.getByRole("combobox", { name: "Search values and inputs" });
  await search.fill("annual_base_pay_quote");
  await search.press("Control+ArrowDown");
  assert((await search.getAttribute("aria-activedescendant")) === null);
  await search.press("ArrowDown");
  const active = await search.getAttribute("aria-activedescendant");
  assert(active !== null);
  await search.press("Control+Enter");
  assert((await search.getAttribute("aria-expanded")) === "true");
  await search.press("Escape");
  assert((await search.getAttribute("aria-expanded")) === "false");
  assert(await panel.isVisible());
  await search.press("Escape");
  await panel.waitFor({ state: "hidden" });
  assert((await total.textContent())?.trim() === "10");
  await page.keyboard.press("Escape");
  assert((await total.textContent())?.trim() === "10");
  await scrollContext(page);
  await tooltipContext(page);
  await pinnedContext(page);
}

async function pinnedContext(page: Page): Promise<void> {
  await page.setViewportSize({ width: 1920, height: 1080 });
  const calculator = page.getByRole("complementary", { name: "Quick calculator" });
  const input = calculator.getByRole("textbox", { name: "Calculator number" });
  const apply = calculator.getByRole("button", { name: "Apply", exact: true });
  const total = page.getByLabel("Calculator total", { exact: true });
  const outside = page.getByRole("button", { name: "comparisons", exact: true });
  const amount = amountButton(page, "Cash after tax");
  const panel = page.getByRole("dialog", { name: "Calculation inspector" });
  const heading = panel.getByRole("heading", { name: "Calculation inspector", exact: true });
  await amount.click();
  const pin = panel.getByRole("button", { name: "Pin beside comparison", exact: true });
  if ((await pin.getAttribute("aria-pressed")) !== "true") {
    await pin.click();
  }
  await saveSettled(page);
  assert(await panel.evaluate((element) => !element.matches(":modal")));
  await heading.focus();
  await page.keyboard.press("Delete");
  await page.keyboard.press("Delete");
  assert((await total.textContent())?.trim() === "10", "Focused inspector owns its keys");
  await page.keyboard.press("Control+,");
  assert(await panel.isVisible());
  await outside.focus();
  await page.keyboard.press("Escape");
  assert(await panel.isVisible(), "Escape outside a pinned inspector must leave it open");
  assert((await total.textContent())?.trim() === "10", "Clearing requires both Escape presses");
  await page.keyboard.press("Escape");
  assert((await total.textContent())?.trim() === "0", "Global Escape sequence clears calculator");
  assert(await panel.isVisible(), "Global clear must leave the unfocused inspector open");
  await input.fill("10");
  await apply.click();
  await outside.focus();
  await page.keyboard.press("Delete");
  await page.keyboard.press("Delete");
  assert((await total.textContent())?.trim() === "0", "Global undo works beside the inspector");
  await focusedEscapeContext(page);
  await hiddenCalculatorContext(page);
  await amount.click();
  await outside.focus();
  await page.keyboard.press("Control+,");
  await page.getByRole("heading", { name: "Preferences", exact: true }).waitFor();
  await outside.click();
  await heading.focus();
  await page.keyboard.press("Escape");
  await panel.waitFor({ state: "hidden" });
  await page.keyboard.press("Control+,");
  await page.getByRole("heading", { name: "Preferences", exact: true }).waitFor();
  await page.setViewportSize({ width: 1280, height: 800 });
}

async function focusedEscapeContext(page: Page): Promise<void> {
  const calculator = page.getByRole("complementary", { name: "Quick calculator" });
  const input = calculator.getByRole("textbox", { name: "Calculator number" });
  const apply = calculator.getByRole("button", { name: "Apply", exact: true });
  const total = page.getByLabel("Calculator total", { exact: true });
  const outside = page.getByRole("button", { name: "comparisons", exact: true });
  const panel = page.getByRole("dialog", { name: "Calculation inspector" });
  const heading = panel.getByRole("heading", { name: "Calculation inspector", exact: true });
  await apply.click();
  await input.focus();
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  assert((await input.inputValue()) === "10", "Typing retains normal field controls");
  assert((await total.textContent())?.trim() === "10");
  await outside.focus();
  await page.keyboard.press("Escape");
  await heading.focus();
  await page.keyboard.press("Escape");
  await panel.waitFor({ state: "hidden" });
  assert((await total.textContent())?.trim() === "10", "Inspector close cancels the pending clear");
  await page.keyboard.press("Escape");
  assert((await total.textContent())?.trim() === "10", "Inspector Escape is not a global prefix");
  await page.keyboard.press("Escape");
  assert((await total.textContent())?.trim() === "0");
}

async function hiddenCalculatorContext(page: Page): Promise<void> {
  const calculator = page.getByRole("complementary", { name: "Quick calculator" });
  const input = calculator.getByRole("textbox", { name: "Calculator number" });
  const apply = calculator.getByRole("button", { name: "Apply", exact: true });
  const total = page.getByLabel("Calculator total", { exact: true });
  await input.fill("10");
  await apply.click();
  const toggle = page.locator("header").getByRole("button", { name: "Calculator", exact: true });
  await toggle.click();
  await calculator.waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "comparisons", exact: true }).focus();
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  await toggle.click();
  assert((await total.textContent())?.trim() === "10", "Hidden calculator ignores global clear");
}

async function scrollContext(page: Page): Promise<void> {
  await page.setViewportSize({ width: 320, height: 800 });
  const scrollbar = page.getByRole("scrollbar", { name: "Scroll comparison horizontally" });
  await scrollbar.focus();
  await scrollbar.press("End");
  await page.waitForFunction(
    () => Number(document.querySelector('[role="scrollbar"]')?.getAttribute("aria-valuenow")) > 0,
  );
  const position = await scrollbar.getAttribute("aria-valuenow");
  await scrollbar.press("a");
  assert((await scrollbar.getAttribute("aria-valuenow")) === position);
  await scrollbar.dispatchEvent("keydown", { key: "Home", ctrlKey: true });
  assert((await scrollbar.getAttribute("aria-valuenow")) === position);
  await scrollbar.press("Home");
  await page.waitForFunction(
    () => document.querySelector('[role="scrollbar"]')?.getAttribute("aria-valuenow") === "0",
  );
  await scrollbar.press("ArrowRight");
  await page.waitForFunction(
    () => Number(document.querySelector('[role="scrollbar"]')?.getAttribute("aria-valuenow")) > 0,
  );
  await scrollbar.press("ArrowLeft");
  await page.waitForFunction(
    () => document.querySelector('[role="scrollbar"]')?.getAttribute("aria-valuenow") === "0",
  );
  await page.setViewportSize({ width: 1280, height: 800 });
}

async function tooltipContext(page: Page): Promise<void> {
  await amountButton(page, "Cash after tax").click();
  const panel = page.getByRole("dialog", { name: "Calculation inspector" });
  await panel.getByRole("button", { name: "Show in comparison", exact: true }).hover();
  await page.getByRole("tooltip").filter({ hasText: "Show in comparison" }).waitFor();
  await page.keyboard.press("Escape");
  await page
    .getByRole("tooltip")
    .filter({ hasText: "Show in comparison" })
    .waitFor({ state: "hidden" });
  assert(await panel.isVisible());
  assert(
    (await page.getByLabel("Calculator total", { exact: true }).textContent())?.trim() === "10",
  );
  await page.keyboard.press("Escape");
  await panel.waitFor({ state: "hidden" });
  assert(
    (await page.getByLabel("Calculator total", { exact: true }).textContent())?.trim() === "10",
  );
}

export { shortcutContextFlow };
