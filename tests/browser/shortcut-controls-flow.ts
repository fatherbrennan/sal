import assert from "node:assert/strict";
import type { Page } from "playwright";
import { readBackup } from "../../src/lib/data/schema.ts";
import { importFixture } from "../measurement/compare-flow.ts";
import { saveSettled } from "../measurement/edit-flow.ts";
import { amountButton } from "../measurement/inspector-flow.ts";
import { navigateTo } from "../measurement/navigation.ts";

const bindings = [
  ["Apply the calculator entry", "Alt+j"],
  ["Open a combobox and highlight the previous option", "Alt+p"],
  ["Open a combobox and highlight the next option", "Alt+g", "Alt+n"],
  ["Select the highlighted option", "Alt+o"],
  ["Close the combobox dropdown", "Alt+c"],
  ["Dismiss a tooltip", "Alt+j"],
  ["Close the calculation inspector", "Alt+j"],
  ["Close page width adjustment", "Alt+j"],
  ["Cancel calculator placement", "Alt+j"],
  ["Scroll the comparison horizontally left", "Alt+p"],
  ["Scroll the comparison horizontally right", "Alt+g", "Alt+n"],
  ["Scroll to the first comparison offers", "Alt+o"],
  ["Scroll to the last comparison offers", "Alt+c"],
  ["Open Preferences", "Alt+j"],
] as const;

async function shortcutControlsFlow(page: Page, artifact: string): Promise<void> {
  await importFixture(page);
  await navigateTo(page, "Keyboard shortcuts");
  assert((await page.locator(".shortcuts table").count()) === 1, "All shortcuts share one table");
  const table = page.getByRole("table", { name: "Keyboard shortcuts", exact: true });
  assert(
    (await table.getByRole("columnheader").allTextContents()).join(" ") ===
      "Command Category Shortcut Context Source Actions",
  );
  assert(
    await table
      .getByRole("button", {
        name: "Add shortcut for Close the calculation inspector",
        exact: true,
      })
      .isVisible(),
  );
  await page.screenshot({ path: `${artifact}.png`, fullPage: true });
  const fixed = table.getByRole("row").filter({
    has: page.getByRole("rowheader", { name: "Move keyboard focus forward", exact: true }),
  });
  assert(await fixed.getByText("Fixed", { exact: true }).isVisible());
  assert((await fixed.getByRole("button").count()) === 1);
  await bindings.reduce(async (previous, [action, first, second]) => {
    await previous;
    await page.getByRole("button", { name: `Add shortcut for ${action}`, exact: true }).click();
    await record(page, first, second);
  }, Promise.resolve());
  await conflictsAndReset(page, artifact);
  await backupControls(page);
  await navigateTo(page, "Keyboard shortcuts");
  await [
    ["Apply the calculator entry", "Enter"],
    ["Close page width adjustment", "Escape"],
    ["Cancel calculator placement", "Escape"],
  ].reduce(async (previous, [action, binding]) => {
    await previous;
    await page.getByRole("button", { name: `Remove ${action}: ${binding}`, exact: true }).click();
    await saveSettled(page);
  }, Promise.resolve());
  await page.reload();
  await calculatorAndCombobox(page);
  await inspectorControls(page);
  await scrollControls(page, artifact);
  await dialogControls(page);
  await navigateTo(page, "Keyboard shortcuts");
  await resetConflict(page);
  await page.getByRole("button", { name: "Reset all shortcuts", exact: true }).click();
  await saveSettled(page);
  assert(
    await page.getByRole("button", { name: "Edit Apply the calculator entry: Enter" }).isVisible(),
  );
}

async function record(page: Page, first: string, second?: string): Promise<void> {
  const dialog = page.getByRole("dialog");
  if (second) {
    await dialog.getByRole("checkbox", { name: "Two-step sequence" }).check();
  }
  const input = dialog.getByRole("textbox");
  await input.press(first);
  if (second) {
    await input.press(second);
  }
  await dialog.getByRole("button", { name: "Save shortcut", exact: true }).click();
  await dialog.waitFor({ state: "hidden" });
  await saveSettled(page);
}

async function conflictsAndReset(page: Page, artifact: string): Promise<void> {
  await page
    .getByRole("button", {
      name: "Add shortcut for Open a combobox and highlight the previous option",
      exact: true,
    })
    .click();
  const dialog = page.getByRole("dialog");
  const input = dialog.getByRole("textbox");
  await input.press("Alt+p");
  assert((await dialog.getByRole("status").textContent())?.includes("another binding"));
  await input.press("Alt+c");
  assert(
    (await dialog.getByRole("status").textContent())?.includes(
      "Close the combobox dropdown” in Combobox",
    ),
  );
  assert(await dialog.getByRole("button", { name: "Save shortcut" }).isDisabled());
  await page.screenshot({ path: `${artifact}-conflict.png` });
  await input.press("Escape");
  await page
    .getByRole("button", { name: "Edit Close page width adjustment: Alt+J", exact: true })
    .click();
  await record(page, "Alt+h");
  await page
    .getByRole("button", { name: "Reset Close page width adjustment", exact: true })
    .click();
  await saveSettled(page);
  assert(
    (await page
      .getByRole("button", { name: "Edit Close page width adjustment: Alt+H", exact: true })
      .count()) === 0,
  );
  assert(
    await page
      .getByRole("button", { name: "Edit Close page width adjustment: Escape", exact: true })
      .isVisible(),
  );
  await page
    .getByRole("button", { name: "Add shortcut for Close page width adjustment", exact: true })
    .click();
  await record(page, "Alt+j");
}

async function backupControls(page: Page): Promise<void> {
  await navigateTo(page, "Backups");
  await page.getByRole("button", { name: "Prepare JSON backup", exact: true }).click();
  const exported: unknown = await page.evaluate(async () => {
    const link = document.querySelector("a[download]");
    if (!(link instanceof HTMLAnchorElement)) {
      throw new Error("Missing backup");
    }
    return await (await fetch(link.href)).json();
  });
  const backup = readBackup(exported);
  const { shortcutComboNext, shortcutWidthClose } =
    backup.records.find((entry) => entry.kind === "preferences")?.fields ?? {};
  assert(shortcutComboNext === ["ArrowDown", "Alt+G Alt+N"].join("\n"));
  assert(shortcutWidthClose === ["Escape", "Alt+J"].join("\n"));
  await navigateTo(page, "Keyboard shortcuts");
  await page.getByRole("button", { name: "Reset all shortcuts", exact: true }).click();
  await saveSettled(page);
  await importFixture(page, backup);
}

async function resetConflict(page: Page): Promise<void> {
  const next = "Open a combobox and highlight the next option";
  const previous = "Open a combobox and highlight the previous option";
  await page.getByRole("button", { name: `Remove ${next}: ArrowDown`, exact: true }).click();
  await saveSettled(page);
  await page.getByRole("button", { name: `Edit ${previous}: ArrowUp`, exact: true }).click();
  await record(page, "ArrowDown");
  await page.getByRole("button", { name: `Reset ${next}`, exact: true }).click();
  await page.getByRole("alert").filter({ hasText: "Conflicts with" }).waitFor();
  assert(await page.getByRole("button", { name: `Edit ${previous}: ArrowDown` }).isVisible());
  assert((await page.getByRole("button", { name: `Edit ${next}: ArrowDown` }).count()) === 0);
}

async function calculatorAndCombobox(page: Page): Promise<void> {
  await navigateTo(page, "comparisons");
  await page.getByLabel("Saved comparison", { exact: true }).selectOption({ label: "Two offers" });
  const calculator = page.getByRole("complementary", { name: "Quick calculator" });
  await calculator.getByRole("button", { name: "Calculator", exact: true }).click();
  const input = calculator.getByRole("textbox", { name: "Calculator number" });
  await input.fill("3");
  await input.press("Alt+j");
  assert(
    (await page.getByLabel("Calculator total", { exact: true }).textContent())?.trim() === "3",
  );
  assert(await page.getByRole("heading", { name: "Two offers", exact: true }).isVisible());
  await input.press("Enter");
  assert(
    (await page.getByLabel("Calculator total", { exact: true }).textContent())?.trim() === "3",
    "Removed Enter binding cannot submit the number field implicitly",
  );
  await calculator.getByRole("button", { name: "Apply", exact: true }).press("Enter");
  assert(
    (await page.getByLabel("Calculator total", { exact: true }).textContent())?.trim() === "6",
  );
  const combo = page.getByRole("combobox", { name: "Earnings scenario", exact: true });
  await combo.press("Alt+g");
  await combo.press("Alt+n");
  const active = await combo.getAttribute("aria-activedescendant");
  assert(active !== null);
  await combo.press("Alt+p");
  assert((await combo.getAttribute("aria-activedescendant")) !== active);
  await combo.press("Alt+o");
  assert((await combo.getAttribute("aria-expanded")) === "false");
  await combo.press("ArrowDown");
  await combo.press("Alt+c");
  assert((await combo.getAttribute("aria-expanded")) === "false");
}

async function inspectorControls(page: Page): Promise<void> {
  await amountButton(page, "Cash after tax").click();
  const inspector = page.getByRole("dialog", { name: "Calculation inspector" });
  const search = inspector.getByRole("combobox", { name: "Search values and inputs" });
  await search.fill("annual_base_pay_quote");
  await search.press("ArrowDown");
  await search.press("Alt+c");
  assert(await inspector.isVisible());
  assert((await search.getAttribute("aria-expanded")) === "false");
  await inspector.getByRole("button", { name: "Show in comparison", exact: true }).hover();
  const tooltip = page.getByRole("tooltip").filter({ hasText: "Show in comparison" });
  await tooltip.waitFor();
  await page.keyboard.press("Alt+j");
  await tooltip.waitFor({ state: "hidden" });
  assert(await inspector.isVisible(), "Tooltip context wins before inspector and global actions");
  await inspector.getByRole("heading", { name: "Calculation inspector", exact: true }).focus();
  await page.keyboard.press("Alt+j");
  await inspector.waitFor({ state: "hidden" });
  assert(await page.getByRole("heading", { name: "Two offers", exact: true }).isVisible());
}

async function scrollControls(page: Page, artifact: string): Promise<void> {
  await page.setViewportSize({ width: 320, height: 800 });
  const scrollbar = page.getByRole("scrollbar", { name: "Scroll comparison horizontally" });
  await scrollbar.press("Alt+o");
  await page.waitForFunction(
    () => document.querySelector('[role="scrollbar"]')?.getAttribute("aria-valuenow") === "0",
  );
  await scrollbar.press("Alt+g");
  await scrollbar.press("Alt+n");
  await page.waitForFunction(
    () => Number(document.querySelector('[role="scrollbar"]')?.getAttribute("aria-valuenow")) > 0,
  );
  const position = Number(await scrollbar.getAttribute("aria-valuenow"));
  await scrollbar.press("Alt+p");
  await page.waitForFunction(
    (before) =>
      Number(document.querySelector('[role="scrollbar"]')?.getAttribute("aria-valuenow")) < before,
    position,
  );
  await scrollbar.press("Alt+c");
  await page.waitForFunction(
    () =>
      document.querySelector('[role="scrollbar"]')?.getAttribute("aria-valuenow") ===
      document.querySelector('[role="scrollbar"]')?.getAttribute("aria-valuemax"),
  );
  await navigateTo(page, "Keyboard shortcuts");
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ path: `${artifact}-narrow.png`, fullPage: true });
  await page.setViewportSize({ width: 1280, height: 800 });
}

async function dialogControls(page: Page): Promise<void> {
  await page.getByRole("heading", { name: "Keyboard shortcuts", exact: true }).focus();
  await page.keyboard.press("Alt+j");
  await page.getByRole("heading", { name: "Preferences", exact: true }).waitFor();
  const width = page.getByRole("button", { name: "Adjust page width", exact: true });
  if (!(await width.isVisible())) {
    await page.getByText("Appearance preferences", { exact: true }).click();
  }
  await width.click();
  const dialog = page.getByRole("dialog", { name: "Page width", exact: true });
  await dialog.getByRole("slider").press("Escape");
  assert(await dialog.isVisible(), "Removed Escape binding cannot close the dialog natively");
  await dialog.getByRole("slider").press("Alt+j");
  await dialog.waitFor({ state: "hidden" });
  const calculator = page.getByRole("complementary", { name: "Quick calculator" });
  await calculator.getByRole("button", { name: "Move calculator", exact: true }).click();
  const placement = page.getByRole("dialog", { name: "Place calculator" });
  await placement.getByRole("button", { name: "Cancel placement", exact: true }).press("Escape");
  assert(await placement.isVisible());
  await placement.getByRole("button", { name: "Cancel placement", exact: true }).press("Alt+j");
  await placement.waitFor({ state: "hidden" });
}

export { record as recordShortcut, shortcutControlsFlow };
