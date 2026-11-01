import assert from "node:assert/strict";
import type { Page } from "playwright";
import { readBackup } from "../../src/lib/data/schema.ts";
import { importFixture } from "../measurement/compare-flow.ts";
import { saveSettled } from "../measurement/edit-flow.ts";
import { amountButton, closeInspector } from "../measurement/inspector-flow.ts";
import { navigateTo } from "../measurement/navigation.ts";
import { uiStateData } from "./ui-state-storage.ts";

const pinName = "Pin beside comparison";
const headline = "Package value after tax, commute costs and commute time value";
const actionTimeout = 5000;

async function openInspector(page: Page): Promise<void> {
  await page.getByRole("button", { name: "comparisons", exact: true }).click();
  await page.getByLabel("Saved comparison", { exact: true }).selectOption({ label: "Two offers" });
  await amountButton(page, headline).click();
}

async function inspectorPreferencesFlow(page: Page): Promise<void> {
  await importFixture(page);
  await navigateTo(page, "Preferences");
  if (!(await page.getByLabel("Appearance", { exact: true }).isVisible())) {
    await page.getByText("Appearance preferences", { exact: true }).click();
  }
  await page.getByLabel("Appearance", { exact: true }).selectOption("dark");
  await saveSettled(page);
  await openInspector(page);
  const panel = page.getByRole("dialog", { name: "Calculation inspector" });
  const pin = panel.getByRole("button", { name: pinName, exact: true });
  await pin.click();
  await saveSettled(page);
  assert((await pin.getAttribute("aria-pressed")) === "true");
  await uiStateData(page);
  await page.reload();
  await panel.waitFor();
  assert(
    (await pin.getAttribute("aria-pressed")) === "true",
    "Reload must reopen the pinned panel",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await panel.waitFor();
  assert(await panel.evaluate((element) => element.matches(":modal")));
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.reload();
  await panel.waitFor();
  assert((await pin.getAttribute("aria-pressed")) === "true");
  await closeInspector(page);
  await amountButton(page, headline).click();
  assert((await pin.getAttribute("aria-pressed")) === "true", "Closing must retain the preference");
  await closeInspector(page);
  await page.reload();
  await openInspector(page);
  assert((await pin.getAttribute("aria-pressed")) === "true", "Reload must restore the preference");
  await closeInspector(page);
  await portablePreferences(page);
}

async function portablePreferences(page: Page): Promise<void> {
  await navigateTo(page, "Backups");
  await page.getByRole("button", { name: "Prepare JSON backup", exact: true }).click();
  const exported: unknown = await page
    .getByRole("link", { name: "Download sal-backup.json" })
    .evaluate(async (element) => {
      if (!(element instanceof HTMLAnchorElement)) {
        throw new Error("Missing backup link");
      }
      return await (await fetch(element.href)).json();
    });
  const backup = readBackup(exported);
  const preferences = backup.records.find((record) => record.kind === "preferences");
  const { inspectorPinned, appearance } = preferences?.fields ?? {};
  assert(inspectorPinned === "yes");
  assert(appearance === "dark");
  const browser = page.context().browser();
  assert(browser);
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  try {
    const imported = await context.newPage();
    imported.setDefaultTimeout(actionTimeout);
    await imported.goto(page.url());
    await importFixture(imported, backup);
    await openInspector(imported);
    const importedPin = imported.getByRole("button", { name: pinName, exact: true });
    assert((await importedPin.getAttribute("aria-pressed")) === "true");
    assert((await imported.locator("html").getAttribute("data-appearance")) === "dark");
    await failedPreferenceSave(imported);
    await importedPin.click();
    await saveSettled(imported);
    assert((await importedPin.getAttribute("aria-pressed")) === "false");
    await closeInspector(imported);
    await imported.reload();
    await openInspector(imported);
    assert((await importedPin.getAttribute("aria-pressed")) === "false");
  } finally {
    await context.close();
  }
}

async function failedPreferenceSave(page: Page): Promise<void> {
  await page.evaluate(() => {
    const original = IDBDatabase.prototype.transaction;
    IDBDatabase.prototype.transaction = function (...args) {
      if (args[1] === "readwrite") {
        throw new DOMException("Preference storage unavailable", "QuotaExceededError");
      }
      return original.apply(this, args);
    };
  });
  const panel = page.getByRole("dialog", { name: "Calculation inspector" });
  const pin = panel.getByRole("button", { name: pinName, exact: true });
  await pin.click();
  await panel.getByRole("alert").filter({ hasText: "Pin preference was not saved" }).waitFor();
  assert((await pin.getAttribute("aria-pressed")) === "true");
  await closeInspector(page);
  await page.reload();
  await openInspector(page);
  assert((await pin.getAttribute("aria-pressed")) === "true");
}

export { inspectorPreferencesFlow };
