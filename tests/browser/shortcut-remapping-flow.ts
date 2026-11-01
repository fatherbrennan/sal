import assert from "node:assert/strict";
import type { Locator, Page } from "playwright";
import { importFixture } from "../measurement/compare-flow.ts";
import { saveSettled } from "../measurement/edit-flow.ts";
import { amountButton } from "../measurement/inspector-flow.ts";
import { navigateTo } from "../measurement/navigation.ts";
import { recordShortcut } from "./shortcut-controls-flow.ts";

const editAction = /^Edit /u;
const replacements = [
  ["Open Preferences", "v"],
  ["Open Keyboard shortcuts", "k"],
  ["Add clicked value", "a"],
  ["Subtract clicked value", "b"],
  ["Multiply by clicked value", "m"],
  ["Divide by clicked value", "d"],
  ["Undo the last calculator operation", "u"],
  ["Clear calculator history and entry", "c"],
  ["Apply the calculator entry", "a"],
  ["Open a combobox and highlight the previous option", "p"],
  ["Open a combobox and highlight the next option", "n"],
  ["Select the highlighted option", "o"],
  ["Close the combobox dropdown", "c"],
  ["Dismiss a tooltip", "x"],
  ["Close the calculation inspector", "i"],
  ["Close page width adjustment", "w"],
  ["Cancel calculator placement", "l"],
  ["Scroll the comparison horizontally left", "p"],
  ["Scroll the comparison horizontally right", "n"],
  ["Scroll to the first comparison offers", "o"],
  ["Scroll to the last comparison offers", "c"],
] as const;

async function replaceBindings(page: Page, sequence: boolean): Promise<void> {
  await navigateTo(page, "Keyboard shortcuts");
  await replacements.reduce(async (previous, [action, key]) => {
    await previous;
    const row = page.getByRole("row").filter({
      has: page.getByRole("rowheader", { name: action, exact: true }),
    });
    await row.getByRole("button", { name: editAction }).click();
    if (sequence) {
      await recordShortcut(page, "Alt+g", `Alt+${key}`);
    } else {
      await recordShortcut(page, `Alt+${key}`);
    }
  }, Promise.resolve());
}

async function shortcutRemappingFlow(page: Page, offline: boolean): Promise<void> {
  await importFixture(page);
  await [false, true].reduce(async (previous, sequence) => {
    await previous;
    await replaceBindings(page, sequence);
    const press = async (key: string, double = false): Promise<void> => {
      if (sequence) {
        await page.keyboard.press("Alt+g");
      }
      await page.keyboard.press(`Alt+${key}`);
      if (double && !sequence) {
        await page.keyboard.press(`Alt+${key}`);
      }
    };
    await press("v");
    await page.getByRole("heading", { name: "Preferences", exact: true }).waitFor();
    await press("k");
    await page.getByRole("heading", { name: "Keyboard shortcuts", exact: true }).waitFor();
    if (offline && sequence) {
      await page
        .getByText("Offline assets ready. This app can reopen without internet.")
        .waitFor({ state: "attached" });
      await page.context().setOffline(true);
    }
    try {
      await page.reload();
      await navigateTo(page, "comparisons");
      await page
        .getByLabel("Saved comparison", { exact: true })
        .selectOption({ label: "Two offers" });
      await calculator(page, press, sequence);
      await combobox(page, press);
      await inspector(page, press);
      await scrolling(page, press);
      await dialogs(page, press);
    } finally {
      await page.context().setOffline(false);
    }
  }, Promise.resolve());
  await navigateTo(page, "Keyboard shortcuts");
  await page.getByRole("button", { name: "Reset all shortcuts", exact: true }).click();
  await page.getByRole("status").filter({ hasText: "Shortcuts saved locally." }).waitFor();
  assert(await page.getByRole("button", { name: "Reset all shortcuts", exact: true }).isDisabled());
}

type Press = (key: string, double?: boolean) => Promise<void>;

async function totalIs(page: Page, expected: string): Promise<void> {
  const actual = (await page.getByLabel("Calculator total", { exact: true }).textContent())?.trim();
  assert(actual === expected, `Calculator total: expected ${expected}, received ${actual}`);
}

async function calculator(page: Page, press: Press, sequence: boolean): Promise<void> {
  const panel = page.getByRole("complementary", { name: "Quick calculator" });
  await panel.getByRole("button", { name: "Calculator", exact: true }).click();
  const input = panel.getByRole("textbox", { name: "Calculator number" });
  const apply = panel.getByRole("button", { name: "Apply", exact: true });
  await input.fill("10");
  await input.press("Enter");
  await totalIs(page, "0");
  await press("a");
  await totalIs(page, "10");
  await apply.focus();
  await press("u", true);
  await totalIs(page, "0");
  await page.evaluate(() => {
    const sample = document.createElement("p");
    sample.id = "shortcut-remapping-value";
    sample.textContent = "2";
    document.body.prepend(sample);
  });
  const sample = page.locator("#shortcut-remapping-value");
  try {
    await [
      ["a", "2"],
      ["m", "4"],
      ["b", "2"],
      ["d", "1"],
    ].reduce(async (previous, [key, expected]) => {
      await previous;
      assert(key && expected);
      await page.getByRole("button", { name: "comparisons", exact: true }).focus();
      if (sequence) {
        await page.keyboard.press("Alt+g");
      }
      await page.keyboard.down("Alt");
      await page.keyboard.down(key);
      await sample.click();
      await page.keyboard.up(key);
      await page.keyboard.up("Alt");
      await totalIs(page, expected);
    }, Promise.resolve());
    await apply.focus();
    await press("c", true);
    await totalIs(page, "0");
  } finally {
    await page.keyboard.up("Alt");
    await sample.evaluate((element) => element.remove());
  }
}

async function combobox(page: Page, press: Press): Promise<void> {
  const combo = page.getByRole("combobox", { name: "Earnings scenario", exact: true });
  await combo.focus();
  await combo.press("ArrowDown");
  assert((await combo.getAttribute("aria-activedescendant")) === null);
  await press("n");
  const active = await combo.getAttribute("aria-activedescendant");
  assert(active !== null);
  await press("p");
  assert((await combo.getAttribute("aria-activedescendant")) !== active);
  await press("o");
  assert((await combo.getAttribute("aria-expanded")) === "false");
  await press("n");
  await press("c");
  assert((await combo.getAttribute("aria-expanded")) === "false");
  await press("v");
  await page.getByRole("heading", { name: "Preferences", exact: true }).waitFor();
  await navigateTo(page, "comparisons");
}

async function inspector(page: Page, press: Press): Promise<void> {
  await amountButton(page, "Cash after tax").click();
  const panel = page.getByRole("dialog", { name: "Calculation inspector" });
  const search = panel.getByRole("combobox", { name: "Search values and inputs" });
  await search.fill("annual_base_pay_quote");
  await press("n");
  await press("c");
  assert((await search.getAttribute("aria-expanded")) === "false");
  await panel.getByRole("button", { name: "Show in comparison", exact: true }).hover();
  const tip = page.getByRole("tooltip").filter({ hasText: "Show in comparison" });
  await tip.waitFor();
  await press("x");
  await tip.waitFor({ state: "hidden" });
  assert(await panel.isVisible());
  await panel.getByRole("heading", { name: "Calculation inspector", exact: true }).focus();
  await press("i");
  await panel.waitFor({ state: "hidden" });
  await amountButton(page, "Cash after tax").click();
  await search.focus();
  await press("i");
  await panel.waitFor({ state: "hidden" });
}

async function scrolling(page: Page, press: Press): Promise<void> {
  await page.setViewportSize({ width: 320, height: 800 });
  const bar = page.getByRole("scrollbar", { name: "Scroll comparison horizontally" });
  await bar.focus();
  await press("c");
  await page.waitForFunction(() => {
    const element = document.querySelector('[role="scrollbar"]');
    return element?.getAttribute("aria-valuenow") === element?.getAttribute("aria-valuemax");
  });
  await press("o");
  await page.waitForFunction(
    () => document.querySelector('[role="scrollbar"]')?.getAttribute("aria-valuenow") === "0",
  );
  await press("n");
  await page.waitForFunction(
    () => Number(document.querySelector('[role="scrollbar"]')?.getAttribute("aria-valuenow")) > 0,
  );
  const before = Number(await bar.getAttribute("aria-valuenow"));
  await press("p");
  await page.waitForFunction(
    (previous) =>
      Number(document.querySelector('[role="scrollbar"]')?.getAttribute("aria-valuenow")) <
      previous,
    before,
  );
  await page.setViewportSize({ width: 1280, height: 800 });
}

async function dialogs(page: Page, press: Press): Promise<void> {
  await navigateTo(page, "Preferences");
  const width = page.getByRole("button", { name: "Adjust page width", exact: true });
  if (!(await width.isVisible())) {
    await page.getByText("Appearance preferences", { exact: true }).click();
  }
  await width.click();
  const dialog = page.getByRole("dialog", { name: "Page width", exact: true });
  await dialog.getByRole("slider").focus();
  await press("w");
  await dialog.waitFor({ state: "hidden" });
  const panel = page.getByRole("complementary", { name: "Quick calculator" });
  const move = panel.getByRole("button", { name: "Move calculator", exact: true });
  await move.click();
  const placement = page.getByRole("dialog", { name: "Place calculator" });
  await press("l");
  await placement.waitFor({ state: "hidden" });
  await cancelDrag(page, move, press);
  await saveSettled(page);
}

async function cancelDrag(page: Page, move: Locator, press: Press): Promise<void> {
  const panel = page.getByRole("complementary", { name: "Quick calculator" });
  const before = await panel.boundingBox();
  const bounds = await move.boundingBox();
  assert(before && bounds);
  await move.focus();
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.mouse.down();
  const distance = 100;
  try {
    await page.mouse.move(bounds.x + distance, bounds.y - distance);
    await press("l");
  } finally {
    await page.mouse.up();
  }
  const after = await panel.boundingBox();
  assert(after && after.x === before.x && after.y === before.y, "Custom binding cancels the drag");
}

export { shortcutRemappingFlow };
