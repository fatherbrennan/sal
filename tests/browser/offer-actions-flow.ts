import assert from "node:assert/strict";
import { isDeepStrictEqual } from "node:util";
import type { Page } from "playwright";
import { readRows } from "../../src/lib/data/database.ts";
import { importFixture } from "../measurement/compare-flow.ts";
import { saveSettled, textField } from "../measurement/edit-flow.ts";
import { backupFixture } from "../measurement/fixtures.ts";
import { topLeftTooltip } from "./tooltip-flow.ts";

async function savedRecords(page: Page) {
  const records: unknown = await page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const opening = indexedDB.open("sal");
        opening.onerror = () => reject(opening.error);
        opening.onsuccess = () => {
          const db = opening.result;
          const transaction = db.transaction("records", "readonly");
          const request = transaction.objectStore("records").getAll();
          transaction.oncomplete = () => {
            db.close();
            resolve(request.result);
          };
          transaction.onerror = () => {
            db.close();
            reject(transaction.error);
          };
        };
      }),
  );
  return readRows(records);
}

async function offerActionsFlow(page: Page, artifact: string): Promise<void> {
  const fixture = backupFixture();
  const first = fixture.records.find((record) => record.name === "Remote offer");
  assert(first);
  first.fields = Object.fromEntries(
    Object.entries({
      ...first.fields,
      annualLeave: "",
      sacrifice: "0",
      energyPrice: "1.98765",
    }).filter(([key]) => key !== "weeklyHours"),
  );
  await importFixture(page, fixture);
  await page.getByRole("button", { name: "offers", exact: true }).click();
  await page.getByRole("button", { name: "Remote offer", exact: true }).click();
  await duplicateAndEdit(page, first.id);
  await archiveAndDuplicate(page);
  await failedDuplicate(page);
  await untitledDuplicate(page);
  await page.evaluate(() => globalThis.scrollTo(0, 0));
  await page.screenshot({ path: `${artifact}.png` });
}

async function duplicateAndEdit(page: Page, sourceId: string): Promise<void> {
  const archive = page.getByRole("button", { name: "Archive offer", exact: true });
  assert((await archive.textContent())?.trim() === "␧");
  await topLeftTooltip(archive, "Archive offer");
  await invalidDuplicate(page);
  const before = await savedRecords(page);
  const source = before.find((record) => record.id === sourceId);
  assert(source);
  const duplicate = page.getByRole("button", { name: "Duplicate offer", exact: true });
  await duplicate.focus();
  await duplicate.press("Enter");
  await page.getByRole("heading", { name: "Copy of Remote offer", exact: true }).waitFor();
  await saveSettled(page);
  const after = await savedRecords(page);
  const copy = after.find((record) => record.name === "Copy of Remote offer");
  assert(copy && copy.id !== source.id && copy.revision === 1 && !copy.archived);
  assert(isDeepStrictEqual(copy.fields, source.fields));
  assert(isDeepStrictEqual(copy.items, source.items));
  assert(
    isDeepStrictEqual(
      after.filter((record) => record.id !== copy.id),
      before,
    ),
  );
  const name = page.getByRole("textbox", { name: "Name", exact: true });
  assert(await name.evaluate((element) => element === document.activeElement));
  await textField(page, "Name", "Adjusted offer");
  await textField(page, "Base salary or revenue (AUD)", "130000");
  assert(
    isDeepStrictEqual(
      (await savedRecords(page)).find((record) => record.id === source.id),
      source,
    ),
  );
  await page.reload();
  await page.getByRole("button", { name: "Adjusted offer", exact: true }).click();
  assert(
    (await page
      .getByRole("textbox", { name: "Base salary or revenue (AUD)", exact: true })
      .inputValue()) === "130000",
  );
}

async function invalidDuplicate(page: Page): Promise<void> {
  const amount = page.getByRole("textbox", { name: "Base salary or revenue (AUD)", exact: true });
  const original = await amount.inputValue();
  await amount.fill("invalid");
  await amount.press("Tab");
  const before = await savedRecords(page);
  await page.getByRole("button", { name: "Duplicate offer", exact: true }).click();
  assert(isDeepStrictEqual(await savedRecords(page), before));
  assert((await amount.inputValue()) === "invalid");
  await textField(page, "Base salary or revenue (AUD)", original);
}

async function archiveAndDuplicate(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Remote offer", exact: true }).click();
  await page.getByRole("button", { name: "Archive offer", exact: true }).click();
  await saveSettled(page);
  const before = await savedRecords(page);
  await page.getByRole("button", { name: "Duplicate offer", exact: true }).click();
  await page.getByRole("heading", { name: "Copy of Remote offer", exact: true }).waitFor();
  const after = await savedRecords(page);
  const source = after.find((record) => record.name === "Remote offer");
  const copy = after.find((record) => record.name === "Copy of Remote offer");
  assert(source?.archived && copy && !copy.archived);
  assert(
    isDeepStrictEqual(
      after.filter((record) => record.id !== copy.id),
      before,
    ),
  );
  assert(isDeepStrictEqual(copy.fields, source.fields));
  assert(isDeepStrictEqual(copy.items, source.items));
}

async function failedDuplicate(page: Page): Promise<void> {
  const before = await savedRecords(page);
  await page.evaluate(() => {
    const original = IDBDatabase.prototype.transaction;
    IDBDatabase.prototype.transaction = function (...args) {
      if (args[1] === "readwrite") {
        throw new DOMException("Duplicate storage unavailable", "QuotaExceededError");
      }
      return original.apply(this, args);
    };
  });
  await page.getByRole("button", { name: "Duplicate offer", exact: true }).click();
  await page.getByRole("alert").filter({ hasText: "Duplicate storage unavailable" }).waitFor();
  assert(isDeepStrictEqual(await savedRecords(page), before));
  assert(
    await page.getByRole("heading", { name: "Copy of Remote offer", exact: true }).isVisible(),
  );
  await page.reload();
}

async function untitledDuplicate(page: Page): Promise<void> {
  await page.getByRole("button", { name: "New offer", exact: true }).click();
  await saveSettled(page);
  const before = await savedRecords(page);
  const draft = before.find((record) => record.kind === "offer" && record.name === "");
  assert(draft);
  await page.getByRole("button", { name: "Duplicate offer", exact: true }).click();
  await page.getByRole("heading", { name: "Copy of Untitled offer", exact: true }).waitFor();
  const after = await savedRecords(page);
  const copy = after.find((record) => record.name === "Copy of Untitled offer");
  assert(copy && copy.id !== draft.id);
  assert(isDeepStrictEqual(copy.fields, draft.fields));
  assert(isDeepStrictEqual(copy.items, draft.items));
  assert(
    isDeepStrictEqual(
      after.filter((record) => record.id !== copy.id),
      before,
    ),
  );
}

export { offerActionsFlow, savedRecords };
