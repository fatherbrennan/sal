import assert from "node:assert/strict";
import { isDeepStrictEqual } from "node:util";
import type { Page } from "playwright";
import { rows } from "../../src/lib/calculations/inputs.ts";
import { importFixture } from "../measurement/compare-flow.ts";
import { saveSettled } from "../measurement/edit-flow.ts";
import { backupFixture } from "../measurement/fixtures.ts";
import { orderFlow } from "../measurement/order-flow.ts";
import { savedRecords } from "./offer-actions-flow.ts";

async function comparisonOffersFlow(page: Page, artifact: string): Promise<void> {
  const fixture = backupFixture();
  const office = fixture.records.find((record) => record.id === "offer-b");
  assert(office);
  office.name = "";
  office.archived = true;
  await importFixture(page, fixture);
  await page.getByRole("button", { name: "comparisons", exact: true }).click();
  await page.getByLabel("Saved comparison", { exact: true }).selectOption({ label: "Two offers" });
  await page.locator(".comparison-setup > summary").click();
  const search = page.getByRole("combobox", { name: "Offers to compare", exact: true });
  const options = page.getByRole("listbox", { name: "Offers to compare", exact: true });
  await page.screenshot({ path: `${artifact}-closed.png` });
  await page.emulateMedia({ colorScheme: "dark" });
  await page.screenshot({ path: `${artifact}-closed-dark.png` });
  await page.emulateMedia({ colorScheme: null });
  await search.focus();
  assert((await options.getAttribute("aria-multiselectable")) === "true");
  assert((await options.getByRole("option", { selected: true }).count()) === 2);
  await page.screenshot({ path: `${artifact}.png` });
  assert(
    await options.getByRole("option", { name: "Untitled offer (archived)", exact: true }).count(),
    JSON.stringify(await options.getByRole("option").allTextContents()),
  );
  await search.fill("Untitled");
  await search.press("ArrowDown");
  await search.press("Enter");
  await saveSettled(page);
  assert((await search.getAttribute("aria-expanded")) === "true");
  assert(await search.evaluate((element) => element === document.activeElement));
  assert((await page.getByLabel("Baseline offer", { exact: true }).inputValue()) === "offer-a");
  const stored = (await savedRecords(page)).find((record) => record.id === "compare-a");
  assert(stored);
  assert(isDeepStrictEqual(rows(stored, "offers"), [{ id: "a", fields: { offerId: "offer-a" } }]));
  await search.press("Enter");
  await saveSettled(page);
  await options.getByRole("option", { selected: true }).waitFor();
  await search.press("Escape");
  await failedSelection(page);
  await page.reload();
  await orderFlow(page);
}

async function failedSelection(page: Page): Promise<void> {
  const before = await savedRecords(page);
  await page.evaluate(() => {
    const original = IDBDatabase.prototype.transaction;
    IDBDatabase.prototype.transaction = function (...args) {
      if (args[1] === "readwrite") {
        throw new DOMException("Selection save unavailable", "QuotaExceededError");
      }
      return original.apply(this, args);
    };
  });
  const search = page.getByRole("combobox", { name: "Offers to compare", exact: true });
  await search.fill("Remote");
  await search.press("ArrowDown");
  await search.press("Enter");
  await page.getByRole("alert").filter({ hasText: "Selection save unavailable" }).waitFor();
  assert(isDeepStrictEqual(await savedRecords(page), before));
  await page
    .getByRole("listbox", { name: "Offers to compare", exact: true })
    .getByRole("option", { name: "Remote offer", exact: true, selected: true })
    .waitFor();
}

export { comparisonOffersFlow };
