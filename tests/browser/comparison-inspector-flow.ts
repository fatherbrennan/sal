import assert from "node:assert/strict";
import type { Locator, Page } from "playwright";
import { importFixture } from "../measurement/compare-flow.ts";
import { saveSettled } from "../measurement/edit-flow.ts";
import { amountButton, closeInspector, followValue } from "../measurement/inspector-flow.ts";
import { selectScenario } from "../measurement/navigation.ts";
import { inspectorFormulaFlow } from "./inspector-formula-flow.ts";
import { inspectorSearch } from "./inspector-search-flow.ts";
import { topLeftTooltip } from "./tooltip-flow.ts";

const headlineLabel = "Package value after tax, commute costs and commute time value";

async function comparisonInspectorFlow(page: Page, artifact: string): Promise<void> {
  await importFixture(page);
  await page.getByRole("button", { name: "comparisons", exact: true }).click();
  await page.getByLabel("Saved comparison", { exact: true }).selectOption({ label: "Two offers" });
  await inspectorFormulaFlow(page, artifact);
  const amount = amountButton(page, headlineLabel);
  const difference = page.locator(".key-result td").nth(1).locator("small .equation-trigger");
  const prior = await difference.textContent();
  await amount.click();
  const panel = page.getByRole("dialog", { name: "Calculation inspector" });
  assert(await panel.evaluate((element) => element.matches(":modal")));
  await inspectorClose(page);
  await inspectorArrows(panel);
  await inspectorPin(page);
  await inspectorSearch(page, artifact);
  await inspectorTooltip(page);
  await panel.getByRole("button", { name: "Pin beside comparison", exact: true }).click();
  await saveSettled(page);
  assert(await panel.evaluate((element) => !element.matches(":modal")));
  assert(
    (await panel
      .getByRole("button", { name: "Pin beside comparison", exact: true })
      .getAttribute("aria-pressed")) === "true",
  );
  await inspectorTooltip(page);
  assert(
    await page
      .locator(".table-scroll")
      .evaluate((element) => element.scrollWidth <= element.clientWidth),
  );
  await amountButton(page, headlineLabel, 1).click();
  assert((await panel.locator("[data-node-heading]").textContent())?.includes("Office offer"));
  await difference.click();
  assert(
    (await panel.locator("[data-node-heading] code").textContent()) === "difference_from_baseline",
  );
  const inputs = panel.getByRole("region", { name: "Calculation inputs" });
  assert((await inputs.getByRole("button").count()) === 2);
  assert((await difference.textContent()) === prior);
  await page.screenshot({ path: `${artifact}-pinned.png`, fullPage: true });
  await narrowInspector(page, artifact);
  await scenarioAfterResize(page);
}

async function scenarioAfterResize(page: Page): Promise<void> {
  const amount = amountButton(page, headlineLabel);
  const panel = page.getByRole("dialog", { name: "Calculation inspector" });
  await page.setViewportSize({ width: 1920, height: 1080 });
  await amount.click();
  assert(
    (await panel
      .getByRole("button", { name: "Pin beside comparison", exact: true })
      .getAttribute("aria-pressed")) === "true",
    "Narrow layouts must retain the saved pin preference",
  );
  const setup = page.locator(".comparison-setup");
  if ((await setup.getAttribute("open")) === null) {
    await setup.locator(":scope > summary").click();
  }
  await selectScenario(page, "Target · recurring");
  await panel.waitFor({ state: "hidden" });
  await amount.click();
  assert((await panel.locator("article").textContent())?.includes("Target"));
  await closeInspector(page);
  await selectScenario(page, "Guaranteed · recurring");
}

async function metricTooltips(page: Page): Promise<void> {
  const table = page.getByRole("region", { name: "Salary comparison", exact: true });
  const categories = await table.locator(".group-heading").getByRole("button").all();
  const collapsed: Locator[] = [];
  await categories.reduce(async (previous, category) => {
    await previous;
    if ((await category.getAttribute("aria-expanded")) === "false") {
      collapsed.push(category);
      await category.click();
    }
  }, Promise.resolve());
  const tooltip = page.getByRole("tooltip");
  const triggers = await table.getByRole("rowheader").getByRole("button").all();
  await triggers.reduce(async (previous, trigger) => {
    await previous;
    await trigger.hover();
    await tooltip.waitFor();
    const label = await trigger.textContent();
    const description = await tooltip.textContent();
    assert(description?.trim() && description.trim() !== label?.trim(), label ?? "Metric tooltip");
    await topLeftTooltip(trigger);
  }, Promise.resolve());
  await metricTooltipFocus(page);
  await collapsed.reduce(async (previous, category) => {
    await previous;
    await category.click();
  }, Promise.resolve());
}

async function metricTooltipFocus(page: Page): Promise<void> {
  const total = page.getByRole("button", { name: "Package value after tax", exact: true });
  const tooltip = page.getByRole("tooltip");
  const narrow = { width: 320, height: 800 };
  await page.setViewportSize(narrow);
  await total.focus();
  await tooltip.waitFor();
  const description = await tooltip.textContent();
  assert(description?.includes("Cash after estimated annual tax"));
  assert(description?.includes("super"));
  assert(description?.includes("personal perk"));
  assert(description?.includes("before commuting"));
  const box = await tooltip.boundingBox();
  assert(
    box &&
      box.x >= 0 &&
      box.x + box.width <= narrow.width &&
      box.y >= 0 &&
      box.y + box.height <= narrow.height,
  );
  await page.keyboard.press("Escape");
  await tooltip.waitFor({ state: "hidden" });
  assert(await total.evaluate((element) => element === document.activeElement));
  await page.setViewportSize({ width: 1920, height: 1080 });
}

async function narrowInspector(page: Page, artifact: string): Promise<void> {
  await page.setViewportSize({ width: 320, height: 800 });
  const panel = page.getByRole("dialog", { name: "Calculation inspector" });
  await page.waitForFunction(() => document.querySelector("dialog.drawer")?.matches(":modal"));
  await panel
    .getByRole("button", { name: "Pin beside comparison", exact: true })
    .waitFor({ state: "hidden" });
  assert(
    (await panel.getByRole("button", { name: "Pin beside comparison", exact: true }).count()) === 0,
  );
  assert(
    (await panel.locator("[data-node-heading] code").textContent()) === "difference_from_baseline",
  );
  const first = panel
    .getByRole("region", { name: "Calculation inputs" })
    .getByRole("button")
    .first();
  await first.click();
  const source = await panel.locator("[data-node-heading] code").textContent();
  assert(source?.startsWith("offer_0__"));
  await followValue(panel, "offer_0__annual_net_package_value");
  const trailLength = 3;
  assert((await panel.getByRole("navigation").getByRole("button").count()) === trailLength);
  const formula = panel
    .locator("article > section[aria-label='Calculation breakdown'] .formula button")
    .first();
  await formula.focus();
  const tooltip = page.getByRole("tooltip");
  await tooltip.waitFor();
  const position = await tooltip.boundingBox();
  const topLimit = 12;
  assert(position !== null && position.x >= 0 && position.x <= topLimit && position.y <= topLimit);
  const close = await panel.getByRole("button", { name: "Close", exact: true }).boundingBox();
  assert(close !== null && position.x + position.width <= close.x);
  await page.keyboard.press("Escape");
  await tooltip.waitFor({ state: "hidden" });
  assert(await panel.isVisible());
  await inspectorClose(page);
  await page.screenshot({ path: `${artifact}-narrow.png`, fullPage: true });
  await closeInspector(page);
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
}

async function inspectorClose(page: Page): Promise<void> {
  const headingIcon = page.getByRole("dialog").locator(".inspector-icon");
  assert((await headingIcon.textContent()) === "※");
  assert(
    await headingIcon.evaluate((element) => {
      const close = element.parentElement?.querySelector('[aria-label="Close"]');
      const heading = element.parentElement?.querySelector("h2");
      const bounds = element.getBoundingClientRect();
      const buttonBounds = close?.getBoundingClientRect();
      return (
        element.tagName === "SPAN" &&
        element.closest("button") === null &&
        getComputedStyle(element).borderStyle === "none" &&
        buttonBounds &&
        heading &&
        bounds.width === buttonBounds.width &&
        bounds.height === buttonBounds.height &&
        bounds.right <= heading.getBoundingClientRect().left
      );
    }),
  );
  const close = page.getByRole("dialog").getByRole("button", { name: "Close", exact: true });
  assert((await close.textContent())?.trim() === "✕", "Close must show only the text icon");
  await topLeftTooltip(close, "Close calculation inspector");
  assert(await close.evaluate((element) => getComputedStyle(element).cursor === "pointer"));
  const box = await close.boundingBox();
  const minimumTarget = 24;
  assert(box !== null && box.width >= minimumTarget && Math.abs(box.width - box.height) < 1);
}

async function inspectorArrows(panel: Locator): Promise<void> {
  assert(
    await panel.locator(".inputs .icon").evaluateAll((icons) =>
      icons.every((icon) => {
        const button = icon.closest("button");
        if (!button) {
          return false;
        }
        const bounds = button.getBoundingClientRect();
        const position = icon.getBoundingClientRect();
        const style = getComputedStyle(button);
        return (
          Math.abs(position.top - bounds.top - Number.parseFloat(style.paddingTop)) <= 2 &&
          Math.abs(bounds.right - position.right - Number.parseFloat(style.paddingRight)) <= 2
        );
      }),
    ),
    "Inspector arrows must sit at the top-right of each input",
  );
  assert(
    (await panel.getByRole("button", { name: "Back one step" }).textContent())?.trim() === "«",
  );
  assert(
    (await panel
      .getByRole("region", { name: "Calculation inputs" })
      .locator(".icon")
      .first()
      .textContent()) === "»",
  );
}

async function inspectorPin(page: Page): Promise<void> {
  const panel = page.getByRole("dialog", { name: "Calculation inspector" });
  const pin = panel.getByRole("button", { name: "Pin beside comparison", exact: true });
  assert((await pin.getAttribute("aria-pressed")) === "false");
  assert((await pin.textContent())?.trim() === "◨");
  assert((await pin.getAttribute("title")) === null);
  const pinBox = await pin.boundingBox();
  const closeBox = await panel.getByRole("button", { name: "Close", exact: true }).boundingBox();
  assert(pinBox !== null && closeBox !== null && pinBox.width === closeBox.width);
  assert(Math.abs(pinBox.width - pinBox.height) < 1, JSON.stringify(pinBox));
  await pin.focus();
  const tooltip = page.getByRole("tooltip");
  await tooltip.waitFor();
  assert((await tooltip.textContent())?.includes("Pin beside comparison"));
  await page.keyboard.press("Escape");
  await tooltip.waitFor({ state: "hidden" });
  assert(await pin.evaluate((element) => element === document.activeElement));
  await pin.press("Enter");
  await saveSettled(page);
  assert((await pin.getAttribute("aria-pressed")) === "true");
  await pin.focus();
  await tooltip.waitFor();
  assert((await tooltip.textContent())?.includes("Use drawer"));
  await pin.press("Space");
  await saveSettled(page);
  assert((await pin.getAttribute("aria-pressed")) === "false");
  assert(await panel.evaluate((element) => element.matches(":modal")));
}

async function inspectorTooltip(page: Page): Promise<void> {
  const panel = page.getByRole("dialog", { name: "Calculation inspector" });
  await panel.locator(".formula button").first().focus();
  const tooltip = page.getByRole("tooltip");
  await tooltip.waitFor();
  const box = await tooltip.boundingBox();
  const edgeLimit = 12;
  assert(
    box !== null && box.x >= 0 && box.x <= edgeLimit && box.y >= 0 && box.y <= edgeLimit,
    `Tooltip must be at the viewport's top left: ${JSON.stringify(box)}`,
  );
  await page.keyboard.press("Escape");
  await tooltip.waitFor({ state: "hidden" });
  assert(await panel.isVisible());
}

export { comparisonInspectorFlow, metricTooltips };
