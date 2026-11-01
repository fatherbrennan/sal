import assert from "node:assert/strict";
import { isDeepStrictEqual } from "node:util";
import type { Page } from "playwright";
import { newRecord, ruleVersion, schemaVersion } from "../../src/lib/data/schema.ts";
import { expandComparison, saveSettled } from "./edit-flow.ts";
import { navigateTo } from "./navigation.ts";

function orderFixture() {
  const now = "2026-10-24T00:00:00.000Z";
  const offers = [
    ["ordering-a", "Order Zulu"],
    ["ordering-b", "Order Alpha"],
    ["ordering-c", "Order Middle"],
  ].map(([id = "", name = ""]) => ({
    ...newRecord("offer", id, now),
    name,
    fields: { amount: "100000", inclusion: "excludes" },
  }));
  const comparison = newRecord("comparison", "ordering-comparison", now);
  comparison.name = "Order check";
  comparison.fields = { ...comparison.fields, baseline: "ordering-c" };
  comparison.items = { offers: offers.map(({ id }) => ({ id, fields: { offerId: id } })) };
  return { schemaVersion, ruleVersion, exportedAt: now, records: [...offers, comparison] };
}

async function columns(page: Page): Promise<string[]> {
  return await page
    .getByRole("region", { name: "Salary comparison" })
    .locator("thead th")
    .evaluateAll((cells) =>
      cells.slice(1).map((cell) => cell.firstChild?.textContent?.trim() ?? ""),
    );
}

async function comparisonOrder(page: Page): Promise<void> {
  await page.getByRole("button", { name: "comparisons", exact: true }).click();
  await page.getByLabel("Saved comparison", { exact: true }).selectOption({ label: "Order check" });
  await expandComparison(page);
  const labels = await page.locator(".content label, .content legend").allTextContents();
  assert(labels.indexOf("Offers to compare") < labels.indexOf("Baseline offer"));
  assert(labels.indexOf("Baseline offer") < labels.indexOf("Earnings scenario"));
  assert(isDeepStrictEqual(await columns(page), ["Order Middle", "Order Zulu", "Order Alpha"]));
  await page.getByLabel("Baseline offer", { exact: true }).selectOption("ordering-b");
  await saveSettled(page);
  assert(isDeepStrictEqual(await columns(page), ["Order Alpha", "Order Zulu", "Order Middle"]));
  const offers = page.getByRole("combobox", { name: "Offers to compare", exact: true });
  const options = page.getByRole("listbox", { name: "Offers to compare", exact: true });
  await offers.fill("Order Alpha");
  await options.getByRole("option", { name: "Order Alpha", exact: true, selected: true }).click();
  await saveSettled(page);
  assert((await page.getByLabel("Baseline offer", { exact: true }).inputValue()) === "");
  assert(isDeepStrictEqual(await columns(page), ["Order Zulu", "Order Middle"]));
  await offers.press("ArrowDown");
  await offers.press("Enter");
  await saveSettled(page);
  await options.getByRole("option", { name: "Order Alpha", exact: true, selected: true }).waitFor();
  await offers.press("Escape");
  assert(isDeepStrictEqual(await columns(page), ["Order Zulu", "Order Middle", "Order Alpha"]));
  await page.reload();
  await page.getByRole("button", { name: "comparisons", exact: true }).click();
  await page.getByLabel("Saved comparison", { exact: true }).selectOption({ label: "Order check" });
  assert(isDeepStrictEqual(await columns(page), ["Order Zulu", "Order Middle", "Order Alpha"]));
}

async function orderFlow(page: Page): Promise<void> {
  await navigateTo(page, "Backups");
  await page.getByLabel("Preview a JSON backup").setInputFiles({
    name: "order.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(orderFixture())),
  });
  await page.getByRole("button", { name: "Apply selected import", exact: true }).click();
  await saveSettled(page);
  await page.getByRole("button", { name: "offers", exact: true }).click();
  const names = (await page.locator("aside .record").allTextContents())
    .map((name) => name.trim())
    .filter((name) => name.startsWith("Order "));
  assert(isDeepStrictEqual(names, ["Order Alpha", "Order Middle", "Order Zulu"]));
  await comparisonOrder(page);
  await page.getByRole("button", { name: "offers", exact: true }).click();
  await page.getByRole("button", { name: "Order Alpha", exact: true }).click();
  assert(
    (await page.getByLabel("Base salary or revenue (AUD)", { exact: true }).inputValue()) ===
      "100000",
  );
}

export { orderFlow };
