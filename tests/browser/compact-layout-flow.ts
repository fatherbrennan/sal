import assert from "node:assert/strict";
import type { Page } from "playwright";
import { navigateTo } from "../measurement/navigation.ts";

const overviewCount = 14;
const desktop = { width: 1440, height: 1000 };
const narrow = { width: 320, height: 800 };
const positionTolerance = 2;

async function compactLayout(page: Page, artifact: string): Promise<void> {
  await navigateTo(page, "comparisons");
  await page.getByRole("button", { name: "Collapse details", exact: true }).click();
  assert((await page.locator(".table-scroll .overview-result:visible").count()) === overviewCount);
  const region = page.getByRole("region", { name: "Salary comparison", exact: true });
  await (["light", "dark"] as const).reduce(async (previous, colorScheme) => {
    await previous;
    await page.emulateMedia({ colorScheme });
    await page.setViewportSize(narrow);
    await region.evaluate((element) => {
      element.scrollLeft = 0;
    });
    await page.evaluate(() => window.scrollTo(0, 0));
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    const amount = region.locator(".overview-result td .amount").first();
    const box = await amount.boundingBox();
    const viewport = await region.boundingBox();
    assert(box && viewport);
    assert(
      box.x + box.width <= viewport.x + viewport.width + positionTolerance,
      "First complete amount fits alongside the metric label",
    );
    const baseline = page.locator(".baseline-context");
    assert(await baseline.evaluate((element) => element.scrollWidth <= element.clientWidth));
    await page.screenshot({ path: `${artifact}-${colorScheme}-320.png`, fullPage: true });
  }, Promise.resolve());
  await page.setViewportSize(desktop);
  await page.emulateMedia({ colorScheme: "light" });
  await page.screenshot({ path: `${artifact}-desktop.png` });
  await inspectorContext(page);
}

async function inspectorContext(page: Page): Promise<void> {
  const amount = page
    .locator(".table-scroll .overview-result td")
    .first()
    .getByRole("button")
    .first();
  await amount.click();
  const inspector = page.locator(".inspector");
  await inspector.waitFor();
  const context = await inspector.locator("article > p").nth(1).textContent();
  assert(context);
  const full = await inspector.textContent();
  assert(full?.split(context).length === 2, "The scenario context appears once");
  assert(!(await inspector.getByText("Unrounded value:", { exact: false }).isVisible()));
  await inspector.getByText("Exact value", { exact: true }).click();
  assert(await inspector.getByText("Unrounded value:", { exact: false }).isVisible());
  await page.keyboard.press("Escape");
}

export { compactLayout };
