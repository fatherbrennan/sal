import assert from "node:assert/strict";
import type { Page } from "playwright";
import { readRows } from "../../src/lib/data/database.ts";
import { importFixture } from "../measurement/compare-flow.ts";
import { saveSettled, textField } from "../measurement/edit-flow.ts";
import { navigateTo } from "../measurement/navigation.ts";
import { removeStoredData, storedRecords, uiStateData } from "./ui-state-storage.ts";

async function uiStateDeletionFlow(page: Page): Promise<void> {
  await importFixture(page);
  await navigateTo(page, "comparisons");
  const picker = page.getByLabel("Saved comparison", { exact: true });
  await picker.selectOption("compare-a");
  await page.locator(".comparison-setup > summary").click();
  const year = page.getByLabel("Financial year", { exact: true });
  await year.selectOption("");
  await saveSettled(page);
  assert((await page.getByLabel("Baseline offer", { exact: true }).inputValue()) === "offer-a");
  await year.selectOption("2026-27");
  await saveSettled(page);
  await page.locator(".comparison-setup > summary").click();
  await uiStateData(page);
  const original = readRows(await storedRecords(page)).find((record) => record.id === "compare-a");
  assert(original);
  await removeStoredData(page, "sal", ["offer-a"]);
  await page.reload();
  await picker.waitFor();
  assert((await picker.inputValue()) === "compare-a");
  await page.getByRole("status").filter({ hasText: "missing from local storage" }).waitFor();
  assert(
    JSON.stringify(
      readRows(await storedRecords(page)).find((record) => record.id === "compare-a"),
    ) === JSON.stringify(original),
    "Loading must not rewrite a comparison with a missing offer",
  );
  await page.locator(".comparison-setup > summary").click();
  assert((await page.getByLabel("Baseline offer", { exact: true }).inputValue()) === "");
  await navigateTo(page, "vehicle");
  const price = page.getByLabel("Energy price (AUD per litre / kWh)", { exact: true });
  await price.fill("2.25");
  await price.press("Tab");
  await saveSettled(page);
  await navigateTo(page, "comparisons");
  if ((await page.locator(".comparison-setup").getAttribute("open")) === null) {
    await page.locator(".comparison-setup > summary").click();
  }
  await page.getByRole("button", { name: "Remove missing offers", exact: true }).click();
  await saveSettled(page);
  const repaired = readRows(await storedRecords(page)).find((record) => record.id === "compare-a");
  assert(repaired);
  const { baseline } = repaired.fields;
  const { offers = [] } = repaired.items;
  assert(baseline === "");
  assert(offers.every(({ fields: { offerId } }) => offerId !== "offer-a"));
  await removedSelections(page);
}

async function removedSelections(page: Page): Promise<void> {
  const picker = page.getByLabel("Saved comparison", { exact: true });
  await removeStoredData(page, "sal", ["compare-a"]);
  await navigateTo(page, "vehicle");
  await textField(page, "Energy price (AUD per litre / kWh)", "2.35");
  await navigateTo(page, "comparisons");
  assert((await picker.inputValue()) === "");
  await uiStateData(page);
  await page.reload();
  await picker.waitFor();
  assert((await picker.inputValue()) === "");
  assert((await picker.locator("option").count()) === 2);
  await navigateTo(page, "offers");
  await page.getByRole("button", { name: "Office offer", exact: true }).click();
  await uiStateData(page);
  await removeStoredData(page, "sal", ["offer-b"]);
  const name = page.getByLabel("Name", { exact: true });
  await name.fill("Deleted offer draft");
  await name.press("Tab");
  const conflict = page.getByRole("region", { name: "Resolve conflicting edits" });
  await conflict.getByLabel("Keep stored version", { exact: true }).check();
  await conflict.getByRole("button", { name: "Resolve selected versions", exact: true }).click();
  await saveSettled(page);
  await navigateTo(page, "comparisons");
  await picker.selectOption("compare-b");
  await page.getByRole("status").filter({ hasText: "missing from local storage" }).waitFor();
  assert(
    (await page.getByRole("columnheader", { name: "Office offer", exact: true }).count()) === 0,
  );
  await navigateTo(page, "offers");
  await page.getByRole("heading", { name: "Compare the whole package", exact: true }).waitFor();
  await removedSettings(page);
}

async function removedSettings(page: Page): Promise<void> {
  await removeStoredData(page, "sal", [
    "offer-b",
    "compare-b",
    "preferences",
    "vehicle",
    "profile",
  ]);
  await page.reload();
  await page.getByRole("button", { name: "New offer", exact: true }).waitFor();
  await page.getByRole("heading", { name: "Compare the whole package", exact: true }).waitFor();
  await navigateTo(page, "Preferences");
  await page.getByRole("heading", { name: "Preferences", exact: true }).waitFor();
  await removeStoredData(page, "sal-ui", ["current"]);
  await page.reload();
  await page.getByRole("button", { name: "New offer", exact: true }).waitFor();
  assert(readRows(await storedRecords(page)).length === 0);
  assert(!(await page.getByRole("button", { name: "New offer", exact: true }).isDisabled()));
}

export { uiStateDeletionFlow };
