import assert from "node:assert/strict";
import type { Page } from "playwright";
import { backupFlow, importFixture } from "../measurement/compare-flow.ts";
import { saveSettled } from "../measurement/edit-flow.ts";
import { navigateTo } from "../measurement/navigation.ts";
import { editableShortcutsFlow } from "./editable-shortcuts-flow.ts";
import { compactShortcutRows } from "./multiple-shortcuts-flow.ts";
import { shortcutAuditTable } from "./shortcut-audit-table.ts";
import { shortcutSequenceFlow } from "./shortcut-sequence-flow.ts";

async function settingsFlow(page: Page, artifact: string): Promise<void> {
  await importFixture(page);
  await shortcutSequenceFlow(page);
  const main = page.getByRole("navigation", { name: "Main navigation", exact: true });
  assert((await main.getByRole("button", { name: "Settings", exact: true }).count()) === 1);
  assert((await main.getByRole("button", { name: "Backups", exact: true }).count()) === 0);
  await page.keyboard.press("Control+,");
  const preferences = page.getByRole("heading", { name: "Preferences", exact: true });
  await preferences.waitFor();
  assert(await preferences.evaluate((element) => document.activeElement === element));
  if (!(await page.getByLabel("Appearance", { exact: true }).isVisible())) {
    await page.getByText("Appearance preferences", { exact: true }).click();
  }
  await page.getByLabel("Appearance", { exact: true }).selectOption("dark");
  await saveSettled(page);
  await shortcutReferenceFlow(page, artifact);
  await editableShortcutsFlow(page, artifact);
  await backupFlow(page);
  await page.screenshot({ path: `${artifact}-backups.png` });
  await page.reload();
  await navigateTo(page, "Preferences");
  if (!(await page.getByLabel("Appearance", { exact: true }).isVisible())) {
    await page.getByText("Appearance preferences", { exact: true }).click();
  }
  assert((await page.getByLabel("Appearance", { exact: true }).inputValue()) === "dark");
  await chordGuards(page);
  await unfinishedEdits(page);
}

async function shortcutReferenceFlow(page: Page, artifact: string): Promise<void> {
  await page.keyboard.press("Control+k");
  await page.keyboard.press("Control+s");
  await page.getByRole("heading", { name: "Keyboard shortcuts", exact: true }).waitFor();
  const search = page.getByRole("searchbox", { name: "Search keyboard shortcuts", exact: true });
  await search.fill("Escape");
  assert(
    await page
      .getByRole("button", { name: "Edit Clear calculator history and entry:", exact: false })
      .isVisible(),
  );
  assert(await page.getByText("Close the calculation inspector", { exact: true }).isVisible());
  await search.fill("Calculator visible");
  assert(await page.getByText("Clear calculator history and entry", { exact: true }).isVisible());
  assert((await page.getByText("Open Preferences", { exact: true }).count()) === 0);
  await search.fill("Focus inside inspector");
  assert(await page.getByText("Close the calculation inspector", { exact: true }).isVisible());
  assert(
    (await page.getByText("Clear calculator history and entry", { exact: true }).count()) === 0,
  );
  await search.fill("no-such-shortcut");
  await page.getByRole("status").filter({ hasText: "No matching shortcuts." }).waitFor();
  await search.fill("Ctrl+K");
  assert(
    await page
      .getByRole("button", { name: "Edit Open Keyboard shortcuts:", exact: false })
      .isVisible(),
  );
  await search.fill("");
  assert((await page.locator(".shortcuts table").count()) === 1, "All shortcuts share one table");
  await shortcutTableLayout(page);
  await standardNavigationLayout(page);
  await compactShortcutRows(page);
  await page.screenshot({ path: `${artifact}-desktop.png`, fullPage: true });
  await page.setViewportSize({ width: 320, height: 800 });
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await heldBindingLayout(page);
  await standardNavigationLayout(page);
  await page.screenshot({ path: `${artifact}-narrow.png`, fullPage: true });
  await page.setViewportSize({ width: 1280, height: 800 });
  await shortcutAuditTable(page);
}

async function standardNavigationLayout(page: Page): Promise<void> {
  const table = page.getByRole("table", { name: "Keyboard shortcuts", exact: true });
  const bindings = await table.locator("tbody tr:has(th)").evaluateAll((rows) =>
    rows.map((row) => ({
      action: row.querySelector("th")?.getAttribute("aria-label"),
      keys: [...row.querySelectorAll("kbd")].map((key) => key.textContent).join(" "),
    })),
  );
  for (const [action, keys] of [
    ["Activate a button or disclosure", ["Enter", "Space"]],
    ["Select the previous radio choice", ["←", "↑"]],
    ["Select the next radio choice", ["→", "↓"]],
    ["Move keyboard focus forward", ["Tab"]],
    ["Move keyboard focus backward", ["Shift Tab"]],
    ["Scroll the comparison horizontally left", ["←"]],
    ["Scroll the comparison horizontally right", ["→"]],
    ["Scroll to the first comparison offers", ["Home"]],
    ["Scroll to the last comparison offers", ["End"]],
    ["Open a combobox and highlight the previous option", ["↑"]],
    ["Open a combobox and highlight the next option", ["↓"]],
  ] as const) {
    const actual = bindings.filter((binding) => binding.action === action);
    assert(actual.length === keys.length, `${action}: each alternative gets its own row`);
    assert(actual.map((binding) => binding.keys).join("|") === keys.join("|"));
  }
  const focus = table.getByRole("row").filter({ hasText: "Move keyboard focus forward" });
  const alignment = await focus
    .locator("th, td")
    .evaluateAll((cells) => cells.map((cell) => getComputedStyle(cell).textAlign));
  const columns = 6;
  assert(alignment.length === columns);
  assert([alignment[0], alignment[2], alignment[3]].every((value) => value === "left"));
  const inspector = table.getByRole("row").filter({
    has: page.getByRole("rowheader", { name: "Close the calculation inspector", exact: true }),
  });
  assert(await inspector.getByText("Calculation inspector", { exact: true }).isVisible());
  const details = inspector.getByRole("button", {
    name: "Details for Close the calculation inspector",
  });
  await details.press("Enter");
  assert(
    await table
      .getByText("Focus inside inspector; key not consumed by a tooltip or dropdown", {
        exact: true,
      })
      .isVisible(),
  );
  await details.press("Space");
  assert((await details.getAttribute("aria-expanded")) === "false");
}

async function shortcutTableLayout(page: Page): Promise<void> {
  const table = page.getByRole("table", { name: "Keyboard shortcuts", exact: true });
  assert(
    (await table.getByRole("columnheader").allTextContents()).join(" ") ===
      "Command Category Shortcut Context Source Actions",
  );
  assert(!(await table.textContent())?.includes("1.5 seconds"));
  assert(!(await table.textContent())?.includes("450 ms"));
  await page.getByText("How shortcuts work", { exact: true }).click();
  assert(await page.getByText("Sequences (“then”):", { exact: true }).isVisible());
  await page.getByText("How shortcuts work", { exact: true }).click();
  const undo = table.getByRole("row").filter({
    has: page.getByRole("rowheader", { name: "Undo the last calculator operation", exact: true }),
  });
  assert((await undo.locator("kbd").allTextContents()).join(" ") === "Delete Delete");
  assert(await undo.getByText("then", { exact: true }).isVisible());
  assert(await undo.getByText("Global", { exact: true }).isVisible());
  await shortcutDetails(page);
  await heldBindingLayout(page);
  assert(
    await table.locator("tbody tr").evaluateAll((rows) =>
      rows.every((row) => {
        const bottoms = [...row.querySelectorAll("th, td")].map(
          (cell) => cell.getBoundingClientRect().bottom,
        );
        return Math.max(...bottoms) - Math.min(...bottoms) <= 1;
      }),
    ),
    "Row borders must align",
  );
  const fontSize = await table.evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).fontSize),
  );
  const compactSize = 13;
  const previousSize = 14;
  assert(fontSize >= compactSize && fontSize < previousSize, "Use compact, readable table text");
  const actions = table.locator(".row-actions").first().getByRole("button");
  assert((await actions.allTextContents()).map((icon) => icon.trim()).join("") === "❯✎✕+↺");
  const tops = await actions.evaluateAll((buttons) =>
    buttons.map((button) => button.getBoundingClientRect().top),
  );
  assert(Math.max(...tops) - Math.min(...tops) <= 1, "Actions stay on one line at desktop width");
}

async function shortcutDetails(page: Page): Promise<void> {
  const details = page.getByRole("button", {
    name: "Details for Undo the last calculator operation",
    exact: true,
  });
  const description = page.getByText("Remove the last operation and restore the previous total.", {
    exact: true,
  });
  const icon = details.locator(".icon");
  assert((await icon.textContent()) === "❯");
  assert(!(await description.isVisible()));
  await details.press("Enter");
  assert((await details.getAttribute("aria-expanded")) === "true");
  assert(
    await icon.evaluate((element) => {
      const transform = new DOMMatrixReadOnly(getComputedStyle(element).transform);
      return transform.b === 1 && transform.c === -1;
    }),
  );
  assert(await description.isVisible());
  assert(await page.locator(".when").filter({ hasText: "history exists" }).isVisible());
  await details.press("Space");
  assert(!(await description.isVisible()));
  assert((await details.getAttribute("aria-expanded")) === "false");
  assert(await details.evaluate((element) => element === document.activeElement));
  const edit = page.getByRole("button", { name: "Edit Add clicked value:", exact: false });
  await edit.press("Enter");
  await page.getByRole("dialog", { name: "Change shortcut", exact: true }).waitFor();
  await page.getByRole("textbox", { name: "Press your new key combination" }).press("Escape");
  assert(await edit.evaluate((element) => element === document.activeElement));
}

async function heldBindingLayout(page: Page): Promise<void> {
  const add = page
    .getByRole("row")
    .filter({ has: page.getByRole("rowheader", { name: "Add clicked value", exact: true }) });
  const hold = add.getByText("(hold) +", { exact: true });
  assert(await hold.isVisible());
  const instruction = await hold.boundingBox();
  const key = await add.locator("kbd").first().boundingBox();
  assert((await add.locator("kbd").allTextContents()).join(" ") === "+ Click");
  assert(
    instruction &&
      key &&
      key.x + key.width <= instruction.x &&
      Math.abs(instruction.y + instruction.height / 2 - key.y - key.height / 2) <= 1,
    "Key comes before the hold instruction on the same line",
  );
}

async function chordGuards(page: Page): Promise<void> {
  const heading = page.getByRole("heading", { name: "Preferences", exact: true });
  await heading.focus();
  await page.keyboard.press("Control+k");
  await page.getByRole("button", { name: "Backups", exact: true }).focus();
  assert(
    !(await page.evaluate(() => {
      const event = new KeyboardEvent("keydown", {
        key: "s",
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      });
      document.activeElement?.dispatchEvent(event);
      return event.defaultPrevented;
    })),
  );
  await heading.focus();
  assert(
    !(await heading.evaluate((element) => {
      const first = new KeyboardEvent("keydown", {
        key: "k",
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      });
      const second = new KeyboardEvent("keydown", {
        key: "s",
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(first, "timeStamp", { value: 1000 });
      Object.defineProperty(second, "timeStamp", { value: 2501 });
      element.dispatchEvent(first);
      element.dispatchEvent(second);
      return second.defaultPrevented;
    })),
  );
  assert(await heading.isVisible());
}

async function unfinishedEdits(page: Page): Promise<void> {
  await navigateTo(page, "offers");
  await page.getByRole("button", { name: "Remote offer", exact: true }).click();
  const salary = page.getByLabel("Base salary or revenue (AUD)", { exact: true });
  const original = await salary.inputValue();
  await salary.fill("invalid");
  await salary.press("Tab");
  await page.keyboard.press("Control+,");
  assert((await salary.inputValue()) === "invalid");
  assert((await page.getByRole("heading", { name: "Settings", exact: true }).count()) === 0);
  await salary.fill(original);
  await salary.press("Tab");
  await saveSettled(page);
  await page.keyboard.press("Control+,");
  await page.getByRole("heading", { name: "Preferences", exact: true }).waitFor();
}

export { settingsFlow, shortcutReferenceFlow };
