import assert from "node:assert/strict";
import type { Page } from "playwright";
import { topLeftTooltip } from "./tooltip-flow.ts";

const previousMatchLimit = 8;
const remoteBaseQuote = /^annual base pay quote · Remote offer /u;

async function searchKeyboard(page: Page): Promise<void> {
  const panel = page.getByRole("dialog", { name: "Calculation inspector" });
  const search = panel.getByRole("combobox", { name: "Search values and inputs" });
  const options = panel.getByRole("listbox", { name: "Values and inputs" });
  assert((await search.getAttribute("placeholder")) === "Search values and inputs…");
  assert((await panel.getByText("Find a value or input", { exact: true }).count()) === 0);
  await search.focus();
  await options.waitFor();
  assert((await options.getByRole("option").count()) > previousMatchLimit);
  const body = panel.locator(".body");
  const before = await body.boundingBox();
  await search.press("Escape");
  assert((await search.getAttribute("aria-expanded")) === "false");
  assert(await panel.isVisible());
  assert((await body.boundingBox())?.y === before?.y);
  await search.press("ArrowDown");
  assert(
    (await search.getAttribute("aria-activedescendant")) ===
      (await options.getByRole("option").first().getAttribute("id")),
  );
  await search.press("ArrowUp");
  assert(
    (await search.getAttribute("aria-activedescendant")) ===
      (await options.getByRole("option").last().getAttribute("id")),
  );
  await search.fill("no-such-inspector-value");
  await panel.getByRole("status").filter({ hasText: "No matching values" }).waitFor();
  assert((await search.getAttribute("aria-activedescendant")) === null);
  await search.press("Enter");
  assert(await panel.isVisible());
  await search.press("Tab");
  assert((await search.getAttribute("aria-expanded")) === "false");
}

async function inspectorSearch(page: Page, artifact: string): Promise<void> {
  await searchKeyboard(page);
  const panel = page.getByRole("dialog", { name: "Calculation inspector" });
  const search = panel.getByRole("combobox", { name: "Search values and inputs" });
  const options = panel.getByRole("listbox", { name: "Values and inputs" });
  await search.fill("annual_base_pay_quote");
  await options.waitFor();
  await page.screenshot({ path: `${artifact}-search.png` });
  const clear = panel.getByRole("button", { name: "Clear search", exact: true });
  assert((await clear.textContent())?.trim() === "✕");
  await topLeftTooltip(clear, "Clear search");
  await clear.focus();
  await clear.press("Enter");
  assert((await search.inputValue()) === "");
  assert(await search.evaluate((element) => element === document.activeElement));
  assert((await options.getByRole("option").count()) > previousMatchLimit);
  await panel.getByRole("button", { name: "Hide options", exact: true }).click();
  assert((await search.getAttribute("aria-expanded")) === "false");
  await panel.getByRole("button", { name: "Show all options", exact: true }).click();
  await options.waitFor();
  await panel.getByRole("heading", { name: "Calculation inspector", exact: true }).click();
  assert((await search.getAttribute("aria-expanded")) === "false");
  assert(
    !(await panel.getByRole("region", { name: "Calculation inputs" }).textContent())?.includes("↳"),
  );
  await search.fill("selected_pay_item_cash_before_cap");
  await search.press("ArrowDown");
  await search.press("Enter");
  await panel.getByRole("heading", { name: "Items in this collection" }).waitFor();
  assert((await search.getAttribute("aria-expanded")) === "false");
  assert((await search.inputValue()) === "");
  await search.fill("annual_base_pay_quote");
  await options.getByRole("option", { name: remoteBaseQuote }).click();
  await panel.getByRole("button", { name: "Back one step", exact: true }).click();
  await panel.getByRole("heading", { name: "Items in this collection" }).waitFor();
  const collection = panel.getByRole("region", { name: "Calculation breakdown", exact: true });
  assert((await collection.locator(".formula").count()) === 0);
  await collection.getByRole("button").first().click();
  await panel.getByRole("button", { name: "Back one step", exact: true }).click();
  await panel.getByRole("heading", { name: "Items in this collection" }).waitFor();
  await panel
    .getByRole("navigation", { name: "Exploration trail" })
    .getByRole("button")
    .first()
    .click();
}

export { inspectorSearch };
