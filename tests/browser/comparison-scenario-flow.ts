import assert from "node:assert/strict";
import type { Page } from "playwright";
import { importFixture } from "../measurement/compare-flow.ts";
import { navigateTo, selectScenario } from "../measurement/navigation.ts";

async function comparisonScenarioFlow(page: Page, artifact: string): Promise<void> {
  await importFixture(page);
  await navigateTo(page, "comparisons");
  await page.getByLabel("Saved comparison", { exact: true }).selectOption("compare-a");
  await page.locator(".comparison-setup > summary").click();
  const search = page.getByRole("combobox", { name: "Earnings scenario", exact: true });
  assert((await search.count()) === 1, "Earnings scenario must use the shared combobox");
  assert((await search.inputValue()) === "Guaranteed · recurring");
  await search.fill("Target · recurring");
  await search.press("ArrowDown");
  await search.press("Enter");
  assert((await search.inputValue()) === "Target · recurring");
  assert((await search.getAttribute("aria-expanded")) === "false");
  await search.fill("no matching scenario");
  await page.getByRole("status").filter({ hasText: "No matching values" }).waitFor();
  await search.press("Escape");
  assert((await search.inputValue()) === "Target · recurring");
  const options = page.getByRole("listbox", { name: "Earnings scenario", exact: true });
  await [
    "Base pay only · recurring",
    "Guaranteed · recurring",
    "Target · recurring",
    "Guaranteed · including one-offs",
    "Target · including one-offs",
  ].reduce(async (previous, label) => {
    await previous;
    await selectScenario(page, label);
    assert((await search.inputValue()) === label);
    assert((await page.locator(".comparison-title").textContent())?.includes(label));
    await search.click();
    assert((await options.getAttribute("aria-multiselectable")) === null);
    assert((await options.getByRole("option", { selected: true }).count()) === 1);
    await search.press("Tab");
    assert((await search.inputValue()) === label);
  }, Promise.resolve());
  await page.screenshot({ path: `${artifact}.png` });
  await page.setViewportSize({ width: 320, height: 800 });
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await search.click();
  await page.screenshot({ path: `${artifact}-narrow.png` });
}

export { comparisonScenarioFlow };
