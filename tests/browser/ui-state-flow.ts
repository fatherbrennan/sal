import assert from "node:assert/strict";
import type { Page } from "playwright";
import { readBackup } from "../../src/lib/data/schema.ts";
import { readUiState } from "../../src/lib/ui-state.ts";
import { importFixture } from "../measurement/compare-flow.ts";
import { saveSettled } from "../measurement/edit-flow.ts";
import { backupFixture } from "../measurement/fixtures.ts";
import { navigateTo, selectScenario } from "../measurement/navigation.ts";
import { inspectorStateFlow } from "./inspector-state-flow.ts";
import { uiStateDeletionFlow } from "./ui-state-deletion-flow.ts";
import { storedRecords, uiStateData } from "./ui-state-storage.ts";

async function uiStateFlow(page: Page): Promise<void> {
  const fixture = backupFixture();
  const comparison = fixture.records.find((record) => record.kind === "comparison");
  assert(comparison);
  fixture.records.push({ ...comparison, id: "compare-b", name: "Second comparison" });
  await importFixture(page, fixture);
  const original = JSON.stringify(await storedRecords(page));
  await navigateTo(page, "offers");
  await page.getByRole("button", { name: "Remote offer", exact: true }).click();
  await page.getByRole("checkbox", { name: "Show archived", exact: true }).check();
  await navigateTo(page, "comparisons");
  await page.getByLabel("Saved comparison", { exact: true }).selectOption("compare-a");
  await page.locator(".comparison-setup > summary").click();
  await selectScenario(page, "Target · recurring");
  await page.getByLabel("Saved comparison", { exact: true }).selectOption("compare-b");
  assert(
    (await page.locator(".comparison-title").textContent())?.includes("Guaranteed · recurring"),
  );
  await page.getByLabel("Saved comparison", { exact: true }).selectOption("compare-a");
  await page.reload();
  await page.getByLabel("Saved comparison", { exact: true }).waitFor();
  assert((await page.getByLabel("Saved comparison", { exact: true }).inputValue()) === "compare-a");
  assert((await page.locator(".comparison-title").textContent())?.includes("Target · recurring"));
  await inspectorStateFlow(page);
  await navigateTo(page, "offers");
  assert(
    (await page
      .getByRole("button", { name: "Remote offer", exact: true })
      .getAttribute("aria-pressed")) === "true",
  );
  assert(await page.getByRole("checkbox", { name: "Show archived", exact: true }).isChecked());
  await navigateTo(page, "Keyboard shortcuts");
  await page.getByRole("heading", { name: "Keyboard shortcuts", exact: true }).waitFor();
  assert(readUiState(await uiStateData(page), fixture.records).settingsSection === "keybindings");
  await page.reload();
  await page.getByRole("heading", { name: "Keyboard shortcuts", exact: true }).waitFor();
  assert(
    JSON.stringify(await storedRecords(page)) === original,
    "UI actions must not rewrite records",
  );
  await stateBoundaries(page);
  await invalidStateFlow(page);
  await uiStateDeletionFlow(page);
  await stateStorageFailure(page);
}

async function stateBoundaries(page: Page): Promise<void> {
  const other = await page.context().newPage();
  try {
    await other.goto(page.url());
    await other.getByRole("heading", { name: "Keyboard shortcuts", exact: true }).waitFor();
    await navigateTo(other, "vehicle");
    await uiStateData(other);
    assert(
      await page.getByRole("heading", { name: "Keyboard shortcuts", exact: true }).isVisible(),
    );
  } finally {
    await other.close();
  }
  await navigateTo(page, "offers");
  const salary = page.getByLabel("Base salary or revenue (AUD)", { exact: true });
  const original = await salary.inputValue();
  await salary.fill("invalid");
  await salary.press("Tab");
  const before = readUiState(await uiStateData(page), backupFixture().records);
  await navigateTo(page, "comparisons");
  assert((await salary.inputValue()) === "invalid");
  const after = readUiState(await uiStateData(page), backupFixture().records);
  assert(
    JSON.stringify({ ...after, surfaces: {} }) === JSON.stringify({ ...before, surfaces: {} }),
    "Rejected navigation must not be saved",
  );
  await salary.fill(original);
  await salary.press("Tab");
  await saveSettled(page);
  await navigateTo(page, "Backups");
  await page.getByRole("button", { name: "Prepare JSON backup", exact: true }).click();
  const raw: unknown = await page
    .getByRole("link", { name: "Download sal-backup.json" })
    .evaluate(async (element) => {
      if (!(element instanceof HTMLAnchorElement)) {
        throw new Error("Missing backup link");
      }
      return await (await fetch(element.href)).json();
    });
  assert(
    JSON.stringify(readBackup(raw).records) === JSON.stringify(await storedRecords(page)),
    "Backups must contain only financial records and preferences",
  );
}

async function invalidStateFlow(page: Page): Promise<void> {
  await uiStateData(page, {
    version: 1,
    view: "comparisons",
    comparisonId: "offer-b",
    offerId: "missing",
    settingsSection: "unknown",
    showArchived: "yes",
    scenarios: { "compare-a": "invalid" },
  });
  await page.reload();
  const picker = page.getByLabel("Saved comparison", { exact: true });
  await picker.waitFor();
  assert((await picker.inputValue()) === "");
  await picker.selectOption("compare-a");
  assert(
    (await page.locator(".comparison-title").textContent())?.includes("Guaranteed · recurring"),
  );
  await navigateTo(page, "offers");
  assert(!(await page.getByRole("checkbox", { name: "Show archived", exact: true }).isChecked()));
  assert(
    await page.getByRole("heading", { name: "Compare the whole package", exact: true }).isVisible(),
  );
  await uiStateData(page, { version: 99, view: "vehicle" });
  await page.reload();
  await page.getByRole("button", { name: "New offer", exact: true }).waitFor();
}

async function stateStorageFailure(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const original = IDBDatabase.prototype.transaction;
    IDBDatabase.prototype.transaction = function (...args) {
      if (this.name === "sal-ui") {
        throw new DOMException("UI state unavailable", "QuotaExceededError");
      }
      return original.apply(this, args);
    };
  });
  await page.reload();
  await page.getByRole("button", { name: "New offer", exact: true }).waitFor();
  await navigateTo(page, "vehicle");
  const price = page.getByLabel("Energy price (AUD per litre / kWh)", { exact: true });
  await price.fill("2.25");
  await price.press("Tab");
  await saveSettled(page);
  await page.reload();
  await navigateTo(page, "vehicle");
  assert((await price.inputValue()) === "2.25", "UI storage failure must not block data saves");
  await page.addInitScript(() => {
    const original = indexedDB.open.bind(indexedDB);
    indexedDB.open = (name, version) => {
      if (name === "sal-ui") {
        throw new DOMException("UI database unavailable", "SecurityError");
      }
      return original(name, version);
    };
  });
  await page.reload();
  await page.getByRole("button", { name: "New offer", exact: true }).waitFor();
  await navigateTo(page, "vehicle");
  assert((await price.inputValue()) === "2.25");
}

export { uiStateFlow };
