import assert from "node:assert/strict";
import type { Page } from "playwright";
import { saveSettled, textField } from "./edit-flow.ts";
import { backupFixture } from "./fixtures.ts";
import { navigateTo } from "./navigation.ts";

const renamedOfferHeader = /^Other tab version\b/u;

async function conflictFlow(page: Page): Promise<void> {
  await page.getByRole("button", { name: "offers", exact: true }).click();
  await page.getByRole("button", { name: "Remote offer", exact: true }).click();
  await page.getByRole("button", { name: "comparisons", exact: true }).click();
  await page.getByLabel("Saved comparison", { exact: true }).selectOption({ label: "Two offers" });
  const other = await page.context().newPage();
  try {
    await other.goto(page.url());
    await navigateTo(other, "offers");
    await other.getByRole("button", { name: "Remote offer", exact: true }).click();
    await textField(other, "Name", "Other tab version");
    await page.getByRole("columnheader", { name: renamedOfferHeader }).waitFor();
    await page.getByRole("button", { name: "offers", exact: true }).click();
    await page.getByRole("button", { name: "Remote offer", exact: true }).click();
    const name = page.getByLabel("Name", { exact: true });
    await name.fill("My version");
    await name.press("Tab");
    const conflict = page.getByRole("region", { name: "Resolve conflicting edits" });
    await conflict.waitFor();
    await conflict.getByRole("button", { name: "Resolve selected versions" }).click();
    await page.getByRole("alert").filter({ hasText: "Choose a version" }).waitFor();
    await conflict.getByLabel("Keep my edit", { exact: true }).check();
    await conflict.getByRole("button", { name: "Resolve selected versions" }).click();
    await saveSettled(page);
    assert((await name.inputValue()) === "My version");
    await other.reload();
    await navigateTo(other, "offers");
    await other.getByRole("button", { name: "My version", exact: true }).click();
    await textField(other, "Name", "Stored winner");
    await name.fill("Discarded edit");
    await name.press("Tab");
    await conflict.getByLabel("Keep stored version", { exact: true }).check();
    await conflict.getByRole("button", { name: "Resolve selected versions" }).click();
    await saveSettled(page);
    assert((await name.inputValue()) === "Stored winner");
  } finally {
    await other.close();
  }
}
async function importChoiceFlow(page: Page): Promise<void> {
  await navigateTo(page, "Backups");
  await page.getByLabel("Preview a JSON backup").setInputFiles({
    name: "restore.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(backupFixture())),
  });
  await page.getByRole("heading", { name: "Import preview", exact: true }).waitFor();
  const records = page
    .locator("main details")
    .filter({ has: page.getByLabel("Keep local version", { exact: true }) });
  await (await records.all()).reduce(async (previous, panel) => {
    await previous;
    await panel.locator("summary").click();
    await panel.getByLabel("Keep local version", { exact: true }).check();
  }, Promise.resolve());
  await page.getByLabel("Use backup version", { exact: true }).first().check();
  await page.getByRole("button", { name: "Apply selected import" }).click();
  await saveSettled(page);
  await page.getByRole("button", { name: "Prepare JSON backup" }).click();
  await page.getByRole("button", { name: "Prepare JSON backup" }).click();
  await page.getByRole("button", { name: "offers", exact: true }).click();
  await page.getByRole("button", { name: "Remote offer", exact: true }).click();
  assert(
    (await page.getByLabel("Base salary or revenue (AUD)", { exact: true }).inputValue()) ===
      "112000",
  );
}

export { conflictFlow, importChoiceFlow };
