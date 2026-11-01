import assert from "node:assert/strict";
import type { Page } from "playwright";
import { readBackup } from "../../src/lib/data/schema.ts";
import { importFixture } from "../measurement/compare-flow.ts";
import { saveSettled } from "../measurement/edit-flow.ts";
import { amountButton } from "../measurement/inspector-flow.ts";
import { navigateTo } from "../measurement/navigation.ts";

function rows(page: Page, action: string) {
  return page
    .getByRole("table", { name: "Keyboard shortcuts", exact: true })
    .getByRole("row")
    .filter({
      has: page.getByRole("rowheader", { name: action, exact: true }),
    });
}

async function record(page: Page, first: string, second?: string): Promise<void> {
  const dialog = page.getByRole("dialog");
  if (second) {
    await dialog.getByRole("checkbox", { name: "Two-step sequence" }).check();
  }
  const input = dialog.getByRole("textbox", { name: "Press your new key combination" });
  await input.press(first);
  if (second) {
    await input.press(second);
  }
  await dialog.getByRole("button", { name: "Save shortcut", exact: true }).click();
  await dialog.waitFor({ state: "hidden" });
  await saveSettled(page);
}

async function add(page: Page, action: string, first: string, second?: string): Promise<void> {
  await page.getByRole("button", { name: `Add shortcut for ${action}`, exact: true }).click();
  await page.getByRole("dialog", { name: "Add shortcut", exact: true }).waitFor();
  await record(page, first, second);
}

async function preferences(page: Page, first: string, second?: string): Promise<void> {
  await page.keyboard.press(first);
  if (second) {
    await page.keyboard.press(second);
  }
  await page.getByRole("heading", { name: "Preferences", exact: true }).waitFor();
  await navigateTo(page, "Keyboard shortcuts");
}

async function calculatorAlternatives(page: Page): Promise<void> {
  await navigateTo(page, "comparisons");
  await page.getByLabel("Saved comparison", { exact: true }).selectOption({ label: "Two offers" });
  const cash = amountButton(page, "Cash after tax");
  const total = page.getByLabel("Calculator total", { exact: true });
  await page.keyboard.down("+");
  await cash.click();
  await page.keyboard.up("+");
  assert((await total.textContent())?.trim() === "77,480");
  await page.keyboard.down("Alt");
  await page.keyboard.down("b");
  await cash.click();
  await page.keyboard.up("b");
  await page.keyboard.up("Alt");
  assert((await total.textContent())?.trim() === "154,960");
  await page.keyboard.press("F8");
  await page.keyboard.press("F8");
  assert((await total.textContent())?.trim() === "77,480");
  await page.keyboard.press("Delete");
  await page.keyboard.press("Delete");
  assert((await total.textContent())?.trim() === "0");
  await page.keyboard.down("+");
  await cash.click();
  await page.keyboard.up("+");
  await page.keyboard.press("F9");
  await page.keyboard.press("F9");
  assert((await total.textContent())?.trim() === "0");
  await page.keyboard.down("+");
  await cash.click();
  await page.keyboard.up("+");
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  assert((await total.textContent())?.trim() === "0");
}

async function alternativesConflict(page: Page): Promise<void> {
  await page
    .getByRole("button", { name: "Add shortcut for Add clicked value", exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "Add shortcut", exact: true });
  const input = dialog.getByRole("textbox");
  await input.press("Alt+b");
  assert((await dialog.getByRole("status").textContent())?.includes("another binding"));
  assert(await dialog.getByRole("button", { name: "Save shortcut" }).isDisabled());
  await input.press("-");
  assert((await dialog.getByRole("status").textContent())?.includes("Subtract clicked value"));
  assert(await dialog.getByRole("button", { name: "Save shortcut" }).isDisabled());
  await input.press("Escape");
  assert(
    await page
      .getByRole("button", { name: "Add shortcut for Add clicked value", exact: true })
      .evaluate((element) => element === document.activeElement),
  );
}

async function backupAlternatives(page: Page): Promise<void> {
  await navigateTo(page, "Backups");
  await page.getByRole("button", { name: "Prepare JSON backup", exact: true }).click();
  const exported: unknown = await page.evaluate(async () => {
    const link = document.querySelector("a[download]");
    if (!(link instanceof HTMLAnchorElement)) {
      throw new Error("Missing backup link");
    }
    return await (await fetch(link.href)).json();
  });
  const backup = readBackup(exported);
  const { shortcutAdd, shortcutPreferences } =
    backup.records.find((entry) => entry.kind === "preferences")?.fields ?? {};
  assert(shortcutAdd === "Plus\nAlt+B");
  assert(shortcutPreferences === "Mod+,\nAlt+G Alt+H\nAlt+G Alt+J");
  const invalid = structuredClone(backup);
  const preferencesRecord = invalid.records.find((entry) => entry.kind === "preferences");
  assert(preferencesRecord);
  preferencesRecord.fields = { ...preferencesRecord.fields, shortcutAdd: "Plus\nPlus" };
  await page.getByLabel("Preview a JSON backup").setInputFiles({
    name: "conflicting-shortcuts.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(invalid)),
  });
  await page.getByRole("alert").filter({ hasText: "Existing data was not changed" }).waitFor();
  await navigateTo(page, "Keyboard shortcuts");
  assert((await rows(page, "Add clicked value").count()) === 2);
  await page.getByRole("button", { name: "Reset all shortcuts", exact: true }).click();
  await saveSettled(page);
  await page.getByRole("status").filter({ hasText: "Shortcuts saved locally." }).waitFor();
  assert((await rows(page, "Add clicked value").count()) === 1);
  await importFixture(page, backup);
  await navigateTo(page, "Keyboard shortcuts");
  assert((await rows(page, "Add clicked value").count()) === 2);
}

async function removeAlternatives(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Remove Add clicked value: Alt+B", exact: true }).click();
  await saveSettled(page);
  assert(
    (await rows(page, "Add clicked value").locator("kbd").allTextContents()).join(" ") ===
      "+ Click",
  );
  const addButton = page.getByRole("button", {
    name: "Add shortcut for Add clicked value",
    exact: true,
  });
  assert(await addButton.evaluate((element) => element === document.activeElement));
  await page.getByRole("button", { name: "Remove Add clicked value: +", exact: true }).click();
  await saveSettled(page);
  await page.reload();
  await navigateTo(page, "Keyboard shortcuts");
  assert(
    await rows(page, "Add clicked value").getByText("Unassigned", { exact: true }).isVisible(),
  );
  const unassignedActions = await rows(page, "Add clicked value")
    .locator(".row-actions")
    .getByRole("button")
    .allTextContents();
  assert(unassignedActions.map((icon) => icon.trim()).join("") === "❯+↺");
  await add(page, "Add clicked value", "Alt+c");
  assert((await rows(page, "Add clicked value").count()) === 1);
  await page.getByRole("button", { name: "Reset Add clicked value", exact: true }).click();
  await saveSettled(page);
  assert(
    (await rows(page, "Add clicked value").locator("kbd").allTextContents()).join(" ") ===
      "+ Click",
  );
  await page.getByRole("button", { name: "Reset all shortcuts", exact: true }).click();
  await saveSettled(page);
}

async function shortcutLayout(page: Page, artifact: string): Promise<void> {
  const table = page.getByRole("table", { name: "Keyboard shortcuts", exact: true });
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  assert(
    await table.evaluate((element) =>
      [...element.querySelectorAll("button")].every(
        (button) =>
          button.getBoundingClientRect().right <=
          Math.min(document.documentElement.clientWidth, element.getBoundingClientRect().right),
      ),
    ),
    "Every shortcut action must fit within the visible table",
  );
  await page
    .getByRole("heading", { name: "Keyboard shortcuts", exact: true })
    .scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${artifact}-multiple-shortcuts.png` });
  await page.setViewportSize({ width: 2048, height: 900 });
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ path: `${artifact}-multiple-shortcuts-wide.png` });
  const details = page.getByRole("button", { name: "Details for Open Preferences", exact: true });
  await details.click();
  await page.screenshot({ path: `${artifact}-multiple-shortcuts-details.png` });
  await page.setViewportSize({ width: 320, height: 800 });
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ path: `${artifact}-multiple-shortcuts-narrow.png`, fullPage: true });
  await details.click();
  await page.setViewportSize({ width: 1280, height: 800 });
}

async function multipleShortcutsFlow(page: Page, artifact: string): Promise<void> {
  await navigateTo(page, "Keyboard shortcuts");
  await add(page, "Add clicked value", "Alt+a");
  await page.getByRole("button", { name: "Edit Add clicked value: Alt+A", exact: true }).click();
  await record(page, "Alt+b");
  await add(page, "Open Preferences", "Alt+g", "Alt+h");
  await add(page, "Open Preferences", "Alt+g", "Alt+j");
  await add(page, "Undo the last calculator operation", "F8");
  await add(page, "Clear calculator history and entry", "F9");
  await page.reload();
  await navigateTo(page, "Keyboard shortcuts");
  assert((await rows(page, "Add clicked value").count()) === 2);
  assert(
    (await rows(page, "Add clicked value").locator("kbd").allTextContents()).join(" ") ===
      "+ Click Alt B Click",
  );
  assert(
    await rows(page, "Add clicked value").first().getByText("Default", { exact: true }).isVisible(),
  );
  assert(
    await rows(page, "Add clicked value").last().getByText("Modified", { exact: true }).isVisible(),
  );
  const search = page.getByRole("searchbox", { name: "Search keyboard shortcuts", exact: true });
  await search.fill("Alt+B");
  assert((await rows(page, "Add clicked value").count()) === 2);
  await search.fill("");
  await shortcutLayout(page, artifact);
  await alternativesConflict(page);
  await preferences(page, "Alt+g", "Alt+h");
  await preferences(page, "Alt+g", "Alt+j");
  await preferences(page, "Control+,");
  await calculatorAlternatives(page);
  await backupAlternatives(page);
  await removeAlternatives(page);
}

async function compactShortcutRows(page: Page): Promise<void> {
  const tables = page.getByRole("table");
  const rowHeights = await tables
    .locator("tbody tr:has(th)")
    .evaluateAll((elements) => elements.map((row) => row.getBoundingClientRect().height));
  const maximumSingleLineHeight = 40;
  assert(
    rowHeights.length > 0 && rowHeights.every((height) => height <= maximumSingleLineHeight),
    "Desktop shortcut rows must fit a single line of text and compact controls",
  );
  const activation = page
    .getByRole("row")
    .filter({
      has: page.getByRole("rowheader", { name: "Activate a button or disclosure", exact: true }),
    })
    .first();
  const badges = activation
    .getByRole("list", { name: "Contexts", exact: true })
    .getByRole("listitem");
  assert((await badges.allTextContents()).join(" ") === "Button Disclosure");
  assert(
    await badges.evaluateAll((tags) =>
      tags.every(
        (tag) =>
          Number.parseFloat(getComputedStyle(tag).borderTopWidth) > 0 &&
          getComputedStyle(tag).whiteSpace === "nowrap",
      ),
    ),
  );
}

export { compactShortcutRows, multipleShortcutsFlow };
