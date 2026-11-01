import assert from "node:assert/strict";
import type { Locator, Page } from "playwright";
import { contrast } from "../browser/accessibility-flow.ts";
import { expandComparison } from "./edit-flow.ts";
import { navigationFlow } from "./equation-navigation-flow.ts";
import { amountButton, closeInspector, followValue, formulaText } from "./inspector-flow.ts";
import { selectScenario } from "./navigation.ts";

const oneOffRow = /^One-off payments and costs/u;
const inspectAmount = /^Inspect /u;

async function equationFlow(page: Page, artifact: string | null = null): Promise<void> {
  await expandComparison(page);
  const trigger = amountButton(page, "Package value before tax per standard paid hour");
  await page.mouse.move(0, 0);
  await trigger.focus();
  await trigger.press("Enter");
  const popup = page.getByRole("dialog", { name: "Calculation inspector", exact: true });
  await popup.waitFor();
  assert(
    (await formulaText(popup)).includes(
      "annual_gross_package_value / standard_paid_hours_per_year",
    ),
    await formulaText(popup),
  );
  assert(
    (await popup.getByRole("region", { name: "Calculation inputs" }).textContent())?.includes(
      "2,080",
    ),
  );
  assert(
    await popup
      .getByRole("heading", { name: "Calculation inspector", exact: true })
      .evaluate((element) => element === document.activeElement),
  );
  await page.keyboard.press("Escape");
  await popup.waitFor({ state: "hidden" });
  assert(await trigger.evaluate((element) => element === document.activeElement));
  const table = page.getByRole("region", { name: "Salary comparison", exact: true });
  await differenceEquations(page, table);
  await breakdownEquations(page);
  await changedScenarioEquation(page);
  await structuredEquation(page, artifact);
  await table.evaluate((element) => {
    element.scrollTop = 0;
    element.scrollLeft = 0;
  });
}

async function comparisonEquations(page: Page): Promise<void> {
  await expandComparison(page);
  const table = page.getByRole("region", { name: "Salary comparison", exact: true });
  await openEveryEquation(
    page,
    table
      .locator("tbody tr:not(.insight-row) td:first-of-type")
      .getByRole("button", { name: inspectAmount }),
  );
}

async function differenceEquations(page: Page, table: Locator): Promise<void> {
  await table.locator("small button").first().click();
  const popup = page.getByRole("dialog");
  assert((await popup.textContent())?.includes("difference_from_baseline"));
  const inputs = popup.getByRole("region", { name: "Calculation inputs" });
  assert((await inputs.textContent())?.includes("offer_0__"));
  assert((await inputs.textContent())?.includes("offer_1__"));
  await closeInspector(page);
  await table
    .getByRole("row")
    .filter({
      has: page.getByRole("rowheader", { name: "Remote share of work hours (%)", exact: true }),
    })
    .getByRole("button", {
      name: "100 percentage points less · -100% relative change",
      exact: true,
    })
    .click();
  assert((await popup.textContent())?.includes("-100 percentage points"));
  await popup.getByRole("region", { name: "Related calculations" }).getByRole("button").click();
  assert((await popup.locator("article > .amount").textContent()) === "-100%");
  await closeInspector(page);
}

async function structuredEquation(page: Page, artifact: string | null): Promise<void> {
  await amountButton(page, "Package value after tax, all job costs and commute time value").click();
  const popup = page.getByRole("dialog");
  const inputs = 3;
  assert(
    (await popup
      .getByRole("region", { name: "Calculation inputs" })
      .getByRole("button")
      .count()) === inputs,
  );
  assert(
    (await formulaText(popup)) ===
      "annual_net_package_after_costs_and_time = annual_net_package_value - annual_job_costs - annual_after_tax_travel_time_value",
  );
  await highlightContrast(page, popup);
  await navigationFlow(page, popup, artifact);
  if (artifact !== null) {
    await popupAppearance(page, artifact);
  }
  await closeInspector(page);
  await amountButton(
    page,
    "Package value after tax, all job costs and commute time value",
    1,
  ).click();
  assert((await popup.locator("[data-node-heading]").textContent())?.includes("Office offer"));
  assert((await popup.getByRole("navigation").getByRole("button").count()) === 1);
  await closeInspector(page);
}

async function highlightContrast(page: Page, popup: Locator): Promise<void> {
  const colors = await popup.evaluate((dialog) => {
    const variable = dialog.querySelector(".formula button");
    const number = dialog.querySelector("article > .amount");
    const context = dialog.querySelector(".name");
    const formula = dialog.querySelector(".formula");
    if (!(variable && number && context && formula)) {
      throw new Error("Missing inspector hierarchy");
    }
    return {
      variable: getComputedStyle(variable).color,
      number: getComputedStyle(number).color,
      weight: getComputedStyle(number).fontWeight,
      context: getComputedStyle(context).color,
      panel: getComputedStyle(dialog).backgroundColor,
      formula: getComputedStyle(formula).backgroundColor,
    };
  });
  const minimum = 4.5;
  const strongWeight = 600;
  assert(contrast(colors.variable, colors.formula) >= minimum);
  assert(contrast(colors.number, colors.panel) >= minimum);
  assert(contrast(colors.context, colors.panel) >= minimum);
  assert(Number(colors.weight) >= strongWeight);
  assert(await page.evaluate(() => document.querySelectorAll("dialog img").length === 0));
}

async function changedScenarioEquation(page: Page): Promise<void> {
  await selectScenario(page, "Target · recurring");
  await amountButton(page, "Package value before tax per standard paid hour").click();
  const popup = page.getByRole("dialog");
  await followValue(popup, "annual_gross_package_value");
  assert((await popup.locator("article > .amount").textContent()) === "$123,200.00");
  await closeInspector(page);
  await selectScenario(page, "Guaranteed · recurring");
}

async function popupAppearance(page: Page, artifact: string): Promise<void> {
  await page.screenshot({ path: `${artifact}-light.png` });
  await page.emulateMedia({ colorScheme: "dark" });
  await highlightContrast(page, page.getByRole("dialog"));
  await page.screenshot({ path: `${artifact}-dark.png` });
  await page
    .getByRole("dialog")
    .locator(".body")
    .evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
  const close = await page
    .getByRole("dialog")
    .getByRole("button", { name: "Close", exact: true })
    .boundingBox();
  assert(close !== null && close.y >= 0);
  await page.screenshot({ path: `${artifact}-scrolled.png` });
  await page.emulateMedia({ colorScheme: "light" });
}

async function openEveryEquation(page: Page, buttons: Locator): Promise<void> {
  const count = await buttons.count();
  assert(count > 0);
  await Array.from({ length: count }, (_, index) => index).reduce(async (previous, index) => {
    await previous;
    await buttons.nth(index).click();
    const popup = page.getByRole("dialog");
    await popup.waitFor();
    if ((await popup.getAttribute("aria-label")) === "Calculation inspector") {
      await verifyInspectorContent(popup);
    } else {
      await verifyLegacyContent(popup);
    }
    await verifyBounds(popup);
    await closeInspector(page);
  }, Promise.resolve());
}

async function verifyBounds(popup: Locator): Promise<void> {
  const fits = await popup.evaluate((element) => {
    const box = element.getBoundingClientRect();
    return (
      box.left >= 0 &&
      box.right <= innerWidth &&
      box.top >= 0 &&
      box.bottom <= innerHeight &&
      element.scrollWidth <= element.clientWidth
    );
  });
  assert(fits, (await popup.getAttribute("aria-label")) ?? "Dialog bounds");
}

async function verifyInspectorContent(popup: Locator): Promise<void> {
  assert((await popup.locator("article").textContent())?.includes("Source"));
  assert((await popup.locator(".amount").textContent()) !== "");
}
async function verifyLegacyContent(popup: Locator): Promise<void> {
  await popup.getByText("Exact equation and sources", { exact: true }).click();
  assert((await popup.locator("pre").allTextContents()).join("\n").includes("="));
}

async function breakdownEquations(page: Page): Promise<void> {
  const heading = page.getByText("Remote offer — breakdown and limitations", { exact: true });
  await heading.click();
  const breakdown = heading.locator("..");
  await breakdown.getByText("Without-offer baseline and taxable income", { exact: true }).click();
  await breakdown
    .getByText("Representative payslip estimates per standard paid hour", { exact: true })
    .click();
  await openEveryEquation(
    page,
    breakdown.locator("th .equation-trigger, dt .equation-trigger, p .equation-trigger"),
  );
  await breakdown.getByRole("button", { name: "Final assessed tax", exact: true }).click();
  assert((await page.getByRole("dialog").textContent())?.includes("Unavailable (unverified-rule)"));
  await closeInspector(page);
  await selectScenario(page, "Guaranteed · including one-offs");
  await page
    .getByRole("row", { name: oneOffRow })
    .getByRole("cell")
    .first()
    .getByRole("button", {
      name: "One-off change in cash after tax and job costs",
      exact: true,
    })
    .click();
  assert(
    (await page.getByRole("dialog").textContent())?.includes(
      "with_one_offs__annual_cash_after_job_costs",
    ),
  );
  await closeInspector(page);
  await selectScenario(page, "Guaranteed · recurring");
  await heading.click();
}

export { comparisonEquations, equationFlow, openEveryEquation };
