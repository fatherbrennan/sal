import assert from "node:assert/strict";
import type { Page } from "playwright";
import { saveSettled } from "./edit-flow.ts";
import { navigateTo } from "./navigation.ts";

const pixelTolerance = 1;
async function uiFlow(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Simple salary", exact: true }).click();
  const rate = await page.getByLabel("Employer super (%)", { exact: true }).boundingBox();
  const limit = await page.getByLabel("Employer contribution limit", { exact: true }).boundingBox();
  assert(rate !== null && limit !== null);
  const defects: string[] = [];
  if (Math.abs(rate.y - limit.y) > pixelTolerance) {
    defects.push("Wrapped labels misalign controls in the same row");
  }
  await page.evaluate(() => globalThis.scrollTo(0, document.body.scrollHeight));
  const header = await page.getByRole("banner").boundingBox();
  if (header === null || header.y < -pixelTolerance) {
    defects.push("Global save status disappears after scrolling");
  }
  const amount = page.getByLabel("Base salary or revenue (AUD)", { exact: true });
  await amount.fill("invalid");
  const typing = await page.getByRole("status", { name: "Save status" }).textContent();
  if (!typing?.includes("Unsaved")) {
    defects.push("Typing is reported as saved before persistence");
  }
  await amount.press("Tab");
  await page.getByRole("alert").filter({ hasText: "last saved value" }).waitFor();
  if (
    !(await page.getByRole("status", { name: "Save status" }).textContent())?.includes("not saved")
  ) {
    defects.push("Invalid local edit is not reflected in global save status");
  }
  await amount.fill("100000");
  await amount.press("Tab");
  await saveSettled(page);
  assert(defects.length === 0, defects.join("; "));
  await reviewAndRecovery(page);
  await page.getByRole("button", { name: "Personal tax settings", exact: true }).click();
  await page.getByRole("button", { name: "offers", exact: true }).click();
  await page.getByRole("heading", { name: "Simple salary", exact: true }).waitFor();
}

async function reviewAndRecovery(page: Page): Promise<void> {
  const amount = page.getByLabel("Base salary or revenue (AUD)", { exact: true });
  await amount.fill("invalid");
  assert(
    await page.evaluate(() => {
      const event = new Event("beforeunload", { cancelable: true });
      globalThis.dispatchEvent(event);
      return event.defaultPrevented;
    }),
  );
  await amount.press("Tab");
  await page.getByText("Pay details", { exact: true }).click();
  await page.getByRole("button", { name: "Review changes", exact: true }).click();
  assert(await amount.evaluate((element) => element === document.activeElement));
  await mobileStatus(page);
  await page.getByRole("button", { name: "Personal tax settings", exact: true }).click();
  assert(await amount.evaluate((element) => element === document.activeElement));
  await page.getByRole("button", { name: "Revert field", exact: true }).click();
  await saveSettled(page);
  assert((await amount.inputValue()) === "100000");
  await storageFailure(page);
}
async function mobileStatus(page: Page): Promise<void> {
  const viewport = page.viewportSize();
  assert(viewport !== null);
  try {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => globalThis.scrollTo(0, document.body.scrollHeight));
    const header = await page.getByRole("banner").boundingBox();
    assert(header !== null && header.y === 0);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: "test-results/sal-save-error-mobile.png", fullPage: false });
  } finally {
    await page.setViewportSize(viewport);
  }
}
async function storageFailure(page: Page): Promise<void> {
  const amount = page.getByLabel("Base salary or revenue (AUD)", { exact: true });
  await page.evaluate(() => {
    const original = IDBDatabase.prototype.transaction;
    globalThis.addEventListener(
      "restore-test-storage",
      () => {
        Object.defineProperty(IDBDatabase.prototype, "transaction", {
          configurable: true,
          value: original,
        });
      },
      { once: true },
    );
    Object.defineProperty(IDBDatabase.prototype, "transaction", {
      configurable: true,
      value: () => {
        throw new DOMException("Storage unavailable for this test", "QuotaExceededError");
      },
    });
  });
  try {
    await amount.fill("150000");
    await amount.press("Tab");
    await page
      .getByRole("status", { name: "Save status" })
      .filter({ hasText: "Storage unavailable for this test" })
      .waitFor();
    await page.getByRole("button", { name: "Revert field", exact: true }).click();
    assert((await amount.inputValue()) === "100000");
    await navigateTo(page, "Backups");
    await page.getByRole("button", { name: "Prepare JSON backup", exact: true }).click();
    await page.getByRole("link", { name: "Download sal-backup.json", exact: true }).waitFor();
  } finally {
    await page.evaluate(() => globalThis.dispatchEvent(new Event("restore-test-storage")));
  }
  await page.getByRole("button", { name: "offers", exact: true }).click();
  await amount.fill("100001");
  await amount.press("Tab");
  await saveSettled(page);
  await amount.fill("100000");
  await amount.press("Tab");
  await saveSettled(page);
}

export { uiFlow };
