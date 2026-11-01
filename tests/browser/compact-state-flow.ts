import assert from "node:assert/strict";
import { isDeepStrictEqual } from "node:util";
import type { Page } from "playwright";
import { readRows } from "../../src/lib/data/database.ts";
import { saveSettled, textField } from "../measurement/edit-flow.ts";
import { navigateTo } from "../measurement/navigation.ts";
import { storedRecords, uiStateData } from "./ui-state-storage.ts";

const scrollOffset = 100;

async function repairLeave(page: Page): Promise<void> {
  await navigateTo(page, "comparisons");
  const cell = page
    .locator('.table-scroll td[data-metric="Annual leave entitlement (hours)"]')
    .first();
  await cell
    .getByRole("button", {
      name: "Review Annual leave earned (hours) inputs · Remote offer",
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: "Enter Paid hours per leave week", exact: true }).click();
  const input = page.getByLabel("Paid hours per leave week", { exact: true });
  assert(await input.evaluate((element) => document.activeElement === element));
  await textField(page, "Paid hours per leave week", "38");
  await page.getByRole("button", { name: "Return to comparison", exact: false }).click();
  assert((await cell.textContent())?.includes("152"));
  assert(
    await page.getByRole("button", { name: "Edit leave inputs", exact: true }).first().isVisible(),
  );
}

async function undoRow(page: Page): Promise<void> {
  await navigateTo(page, "offers");
  await page.getByRole("searchbox", { name: "Filter offers", exact: true }).fill("");
  await page.getByRole("button", { name: "Remote offer", exact: true }).click();
  const before = readRows(await storedRecords(page)).find((record) => record.id === "offer-a");
  assert(before);
  const { earnings: original = [] } = before.items;
  const group = page.locator("[data-disclosure=earnings]");
  if ((await group.getAttribute("open")) === null) {
    await group.locator(":scope > summary").click();
  }
  await group.getByRole("button", { name: "Remove row 1", exact: true }).click();
  await saveSettled(page);
  const label = group.getByLabel("Description", { exact: true });
  await label.fill("Edited after removal");
  await label.press("Tab");
  await saveSettled(page);
  await group.getByRole("button", { name: "Undo removal", exact: true }).click();
  await saveSettled(page);
  const restored = readRows(await storedRecords(page)).find((record) => record.id === "offer-a");
  assert(restored);
  const { earnings = [] } = restored.items;
  assert(isDeepStrictEqual(earnings[0], original[0]));
  const { label: description } = earnings[1]?.fields ?? {};
  assert(description === "Edited after removal");
  assert(earnings[1]?.id === original[1]?.id);
}

async function restoreComparison(page: Page): Promise<void> {
  await navigateTo(page, "comparisons");
  const before = await storedRecords(page);
  await page.setViewportSize({ width: 320, height: 800 });
  await page.locator(".table-scroll").evaluate((element, left) => {
    element.scrollLeft = left;
    window.scrollTo(0, element.getBoundingClientRect().top + window.scrollY);
  }, scrollOffset);
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));
  const top = await page.evaluate(() => window.scrollY);
  await uiStateData(page);
  await page.reload();
  const section = page.getByRole("button", {
    name: "Annual leave details",
    exact: true,
    expanded: true,
  });
  await section.waitFor();
  await page.waitForFunction(
    ({ expectedTop, left }) =>
      Math.abs(window.scrollY - expectedTop) < 2 &&
      Math.abs((document.querySelector(".table-scroll")?.scrollLeft ?? 0) - left) < 2,
    { expectedTop: top, left: scrollOffset },
  );
  assert(isDeepStrictEqual(await storedRecords(page), before));
  await navigateTo(page, "offers");
  await page.getByRole("button", { name: "Office offer", exact: true }).click();
  const leave = page.locator('details[data-disclosure="Paid annual leave"]');
  assert((await leave.getAttribute("open")) === null);
  await page.getByRole("button", { name: "Remote offer", exact: true }).click();
  await page.getByLabel("Paid hours per leave week", { exact: true }).waitFor();
  await page.setViewportSize({ width: 1440, height: 1000 });
}

export { repairLeave, restoreComparison, undoRow };
