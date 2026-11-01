import assert from "node:assert/strict";
import type { Page } from "playwright";
import { readBackup } from "../../src/lib/data/schema.ts";
import { saveSettled } from "../measurement/edit-flow.ts";
import { navigateTo } from "../measurement/navigation.ts";

const wide = { width: 2560, height: 1440 };
const tolerance = 2;

async function dragWidthFlow(page: Page, artifact: string): Promise<void> {
  await page.setViewportSize(wide);
  await navigateTo(page, "Preferences");
  const trigger = page.getByRole("button", { name: "Adjust page width", exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Page width", exact: true });
  const slider = dialog.getByRole("slider", { name: "Page width", exact: true });
  assert((await slider.inputValue()) === "100");
  assert((await slider.getAttribute("step")) === "5");
  assert(await slider.evaluate((element) => document.activeElement === element));
  const fixed = await dialog.boundingBox();
  const track = await slider.boundingBox();
  assert(fixed && track);
  const thumbInset = 8;
  await page.mouse.move(track.x + track.width - thumbInset, track.y + track.height / 2);
  await page.mouse.down();
  await page.mouse.move(track.x + track.width / 2, track.y + track.height / 2, { steps: 10 });
  await page.waitForFunction(
    () => document.documentElement.style.getPropertyValue("--app-width") === "60%",
  );
  const background = await page.locator("main").boundingBox();
  const viewportWidth = await page.evaluate(() => document.documentElement.clientWidth);
  const sixtyPercent = 0.6;
  assert(background && Math.abs(background.width - viewportWidth * sixtyPercent) < tolerance);
  const afterDrag = await dialog.boundingBox();
  assert(
    afterDrag &&
      afterDrag.x === fixed.x &&
      afterDrag.y === fixed.y &&
      afterDrag.width === fixed.width &&
      afterDrag.height === fixed.height,
    "Dragging must not move or resize the dialog",
  );
  await page.screenshot({ path: `${artifact}-dragging.png` });
  await page.mouse.up();
  await saveSettled(page);
}

async function widthKeyboardFlow(page: Page, artifact: string): Promise<void> {
  const dialog = page.getByRole("dialog", { name: "Page width", exact: true });
  const slider = dialog.getByRole("slider", { name: "Page width", exact: true });
  const trigger = page.getByRole("button", { name: "Adjust page width", exact: true });
  await slider.press("Home");
  await saveSettled(page);
  assert((await slider.inputValue()) === "20");
  await page.setViewportSize({ width: 390, height: 844 });
  const minimum = await page.locator("main").boundingBox();
  const minimumWidth = 320;
  assert(minimum && Math.abs(minimum.width - minimumWidth) < tolerance);
  const mobileDialog = await dialog.boundingBox();
  assert(mobileDialog && mobileDialog.width > minimum.width);
  await page.screenshot({ path: `${artifact}-mobile.png` });
  await page.setViewportSize({ width: 280, height: 800 });
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.setViewportSize(wide);
  await slider.press("ArrowRight");
  await saveSettled(page);
  assert((await slider.inputValue()) === "25");
  await slider.press("Shift+Tab");
  const close = dialog.getByRole("button", { name: "Close", exact: true });
  assert(await close.evaluate((element) => document.activeElement === element));
  await close.press("Tab");
  assert(await slider.evaluate((element) => document.activeElement === element));
  await slider.press("Escape");
  assert(!(await dialog.isVisible()));
  assert(await trigger.evaluate((element) => document.activeElement === element));
}

async function savedWidthFlow(page: Page): Promise<void> {
  const dialog = page.getByRole("dialog", { name: "Page width", exact: true });
  const slider = dialog.getByRole("slider", { name: "Page width", exact: true });
  const trigger = page.getByRole("button", { name: "Adjust page width", exact: true });
  const close = dialog.getByRole("button", { name: "Close", exact: true });
  await page.reload();
  await navigateTo(page, "Preferences");
  await trigger.click();
  assert((await slider.inputValue()) === "25");
  await failedWidthSave(page);
  await close.click();
  await page.reload();
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
  const { pageWidth } =
    readBackup(exported).records.find((record) => record.kind === "preferences")?.fields ?? {};
  assert(pageWidth === "25");
  await navigateTo(page, "Preferences");
  await trigger.click();
  await slider.press("End");
  await saveSettled(page);
  assert((await slider.inputValue()) === "100");
  await close.click();
}

async function failedWidthSave(page: Page): Promise<void> {
  await page.evaluate(() => {
    const original = IDBDatabase.prototype.transaction;
    IDBDatabase.prototype.transaction = function (...args) {
      if (args[1] === "readwrite") {
        throw new DOMException("Width storage unavailable", "QuotaExceededError");
      }
      return original.apply(this, args);
    };
  });
  const dialog = page.getByRole("dialog", { name: "Page width", exact: true });
  await dialog.getByRole("slider").press("ArrowRight");
  await dialog.getByRole("alert").filter({ hasText: "Width not saved" }).waitFor();
  assert((await dialog.getByRole("slider").inputValue()) === "30");
}

async function pageWidthFlow(page: Page, artifact: string): Promise<void> {
  await dragWidthFlow(page, artifact);
  await widthKeyboardFlow(page, artifact);
  await rapidWidthFlow(page);
  await savedWidthFlow(page);
}

async function rapidWidthFlow(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Adjust page width", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Page width", exact: true });
  const slider = dialog.getByRole("slider");
  await slider.evaluate((element) => {
    if (!(element instanceof HTMLInputElement)) {
      throw new Error("Missing width slider");
    }
    for (const width of ["30", "35", "40"]) {
      element.value = width;
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });
  await saveSettled(page);
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await page.reload();
  await navigateTo(page, "Preferences");
  await page.getByRole("button", { name: "Adjust page width", exact: true }).click();
  assert((await slider.inputValue()) === "40", "Rapid changes must save the last chosen width");
  await slider.press("Home");
  await saveSettled(page);
  await slider.press("ArrowRight");
  await saveSettled(page);
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
}

export { pageWidthFlow };
