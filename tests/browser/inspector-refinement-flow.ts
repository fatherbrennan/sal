import assert from "node:assert/strict";
import type { Locator, Page } from "playwright";
import { importFixture } from "../measurement/compare-flow.ts";
import { saveSettled } from "../measurement/edit-flow.ts";
import { closeInspector, followValue } from "../measurement/inspector-flow.ts";
import { createFormula } from "./formulas-flow.ts";

async function inspectorRefinementFlow(page: Page): Promise<void> {
  await calculatorDefault(page);
  await importFixture(page);
  await createFormula(page);
  await page.getByRole("button", { name: "comparisons", exact: true }).click();
  await page.getByLabel("Saved comparison", { exact: true }).selectOption("compare-a");
  const picker = page.getByRole("combobox", { name: "Custom formula rows", exact: true });
  await picker.fill("Salary in thousands");
  await page.getByRole("option", { name: "Salary in thousands", exact: true }).click();
  await picker.press("Escape");
  await saveSettled(page);
  const panel = page.getByRole("dialog", { name: "Calculation inspector", exact: true });
  await page.locator(".key-result .equation-trigger").first().click();
  const pin = panel.getByRole("button", { name: "Pin beside comparison", exact: true });
  if ((await pin.getAttribute("aria-pressed")) === "false") {
    await pin.click();
    await saveSettled(page);
  }
  const row = page
    .getByRole("rowheader", { name: "Salary in thousands", exact: true })
    .locator("..");
  const amount = row.getByRole("button", {
    name: "Inspect Salary in thousands: $110.00 · Office offer",
    exact: true,
  });
  await amount.scrollIntoViewIfNeeded();
  const before = await page.evaluate(() => scrollY);
  await amount.click();
  await panel.waitFor();
  const after = await page.evaluate(() => scrollY);
  assert(Math.abs(after - before) < 2, `Opening custom formula moved page: ${before} -> ${after}`);
  assert((await amount.getAttribute("aria-current")) === "true");
  assert(
    (await panel.locator("[data-node-heading]").textContent())?.includes("salary_in_thousands"),
  );
  await inspectorHistory(page, panel);
  await relativeHighlight(page, panel, row);
}

async function calculatorDefault(page: Page): Promise<void> {
  const bottomMarginTolerance = 14;
  const calculator = page.getByRole("complementary", { name: "Quick calculator" });
  await calculator.waitFor();
  await page.waitForFunction(() => {
    const box = document.querySelector("#quick-calculator")?.getBoundingClientRect();
    return box && Math.abs(box.left + box.width / 2 - document.documentElement.clientWidth / 2) < 2;
  });
  const box = await calculator.boundingBox();
  assert(
    box &&
      Math.abs(box.y + box.height - (page.viewportSize()?.height ?? 0)) <= bottomMarginTolerance,
  );
}

async function inspectorHistory(page: Page, panel: Locator): Promise<void> {
  const trail = panel.getByRole("navigation", { name: "Exploration trail" });
  const input = panel
    .getByRole("region", { name: "Calculation inputs", exact: true })
    .getByRole("button")
    .first();
  const symbol = await input.locator("code").textContent();
  assert(symbol);
  await input.click();
  assert((await trail.getByRole("button").count()) === 2);
  assert(!(await panel.textContent())?.includes("Selected inside"));
  assert(
    (await panel.locator("article > p").allTextContents()).every(
      (text) => text !== "Calculated from the equations below in this context.",
    ),
  );
  const search = panel.getByRole("combobox", { name: "Search values and inputs" });
  await search.fill("salary");
  await search.press("Backspace");
  assert((await search.inputValue()) === "salar");
  assert((await trail.getByRole("button").count()) === 2);
  await search.press("Escape");
  await panel.locator("[data-node-heading]").focus();
  await page.keyboard.press("Backspace");
  assert((await trail.getByRole("button").count()) === 1);
  await page.keyboard.press("Backspace");
  assert((await trail.getByRole("button").count()) === 1);
  await followValue(panel, symbol);
  await panel.getByRole("button", { name: "Show in comparison", exact: true }).click();
  await page.keyboard.press("Backspace");
  assert((await trail.getByRole("button").count()) === 2, "Unfocused inspector must not navigate");
  await page.locator(".equation-trigger[aria-current='true']").click();
  assert((await trail.getByRole("button").count()) === 2);
  await panel.getByRole("button", { name: "Back one step", exact: true }).click();
  await compactInspector(panel);
}

async function relativeHighlight(page: Page, panel: Locator, row: Locator): Promise<void> {
  const difference = row.locator("small .equation-trigger");
  await difference.click();
  const dollar = difference.locator('[data-inspector-value="difference_from_baseline"]');
  const percentage = difference.locator('[data-inspector-value="percentage_change"]');
  assert((await dollar.getAttribute("data-inspected")) === "true");
  assert((await page.locator("td[data-inspected]").count()) === 0);
  await followValue(panel, "percentage_change");
  assert((await dollar.getAttribute("data-inspected")) === null);
  assert((await percentage.getAttribute("data-inspected")) === "true");
  assert(
    (await percentage.evaluate((element) => getComputedStyle(element).outlineStyle)) === "solid",
  );
  await page.keyboard.press("Backspace");
  assert((await dollar.getAttribute("data-inspected")) === "true");
  assert(
    (await page.getByRole("button", { name: "Return to inspector", exact: true }).count()) === 0,
  );
  await closeInspector(page);
  await page.locator(".key-result .equation-trigger").first().click();
  const scenario = panel
    .locator("details")
    .filter({ has: page.getByText("Scenario context", { exact: true }) });
  assert((await scenario.count()) === 1);
  assert(
    await scenario.evaluate((element) => {
      const source = element.closest("article")?.querySelector(".source");
      return source && source.compareDocumentPosition(element) === Node.DOCUMENT_POSITION_FOLLOWING;
    }),
  );
  await page.screenshot({ path: "test-results/inspector-refinements.png" });
}

async function compactInspector(panel: Locator): Promise<void> {
  const previousHeight = 28;
  const symbols = panel.locator(".input-label code");
  assert((await symbols.count()) > 0);
  assert(
    await symbols.first().evaluate((element) => {
      const label = element.closest(".input-label");
      const name = label?.firstChild;
      if (!name) {
        return false;
      }
      const range = document.createRange();
      range.selectNode(name);
      return (
        getComputedStyle(element).fontSize === "12px" &&
        element.getBoundingClientRect().top >= range.getBoundingClientRect().bottom
      );
    }),
  );
  const step = panel.locator(".trail-step").first();
  assert((await step.evaluate((element) => getComputedStyle(element).fontSize)) === "12px");
  const box = await step.boundingBox();
  assert(box && box.height < previousHeight && box.height >= 24);
}

export { inspectorRefinementFlow };
