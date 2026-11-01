import assert from "node:assert/strict";
import type { Page } from "playwright";
import { importFixture } from "./compare-flow.ts";
import { comparisonOverviewFlow } from "./comparison-overview-flow.ts";
import { editorSection, saveSettled, textField } from "./edit-flow.ts";
import { financialValueFlow } from "./financial-value-flow.ts";
import { closeInspector, formulaText } from "./inspector-flow.ts";
import { navigateTo } from "./navigation.ts";

import { packageOverflowFlow } from "./package-value-flow.ts";

const favorableChange = /more · better/u;

async function uxFlow(page: Page, artifact: string): Promise<void> {
  await navigateTo(page, "Offer defaults");
  await page.getByLabel("Financial year", { exact: true }).selectOption("2026-27");
  await saveSettled(page);
  await importFixture(page);
  await page.getByRole("button", { name: "comparisons", exact: true }).click();
  await page.getByLabel("Saved comparison", { exact: true }).selectOption({ label: "Two offers" });
  const setup = page.locator(".comparison-setup");
  assert((await setup.count()) === 1, "Configured comparisons need a compact setup disclosure");
  assert((await setup.getAttribute("open")) === null);
  const table = page.getByRole("region", { name: "Salary comparison" });
  assert((await table.textContent())?.includes("$77,480.00"));
  assert((await table.getByRole("button", { name: favorableChange }).count()) > 0);
  await comparisonOverviewFlow(page);
  await hourlyEquationFlow(page);
  await stickyGroups(page);
  await table.evaluate((element) => {
    element.scrollTop = 0;
    element.scrollLeft = 0;
  });
  await page.evaluate(() => globalThis.scrollTo(0, 0));
  await page.screenshot({ path: `${artifact}-comparison.png`, fullPage: true });
  await page.getByRole("button", { name: "offers", exact: true }).click();
  await page.getByRole("button", { name: "Remote offer", exact: true }).click();
  const summary = page.getByRole("region", { name: "Live offer summary" });
  assert((await summary.textContent())?.includes("$77,480.00"));
  await missingInputFlow(page, artifact);
  await rosterInputFlow(page);
  await sharedInputFlow(page);
  await packageOverflowFlow(page);
  await financialValueFlow(page, artifact);
}

async function hourlyEquationFlow(page: Page): Promise<void> {
  const hours = page.getByRole("button", { name: "Pay, super and package value", exact: true });
  await hours.focus();
  if ((await hours.getAttribute("aria-expanded")) === "false") {
    await hours.press("Enter");
  }
  assert((await hours.getAttribute("aria-expanded")) === "true");
  await page
    .getByRole("button", { name: "Inspect Package value before tax per standard paid hour:" })
    .first()
    .click();
  const popup = page.getByRole("dialog");
  assert((await popup.getByText("Calculation used here", { exact: true }).count()) === 1);
  assert(
    (await formulaText(popup)).includes(
      "annual_gross_package_value / standard_paid_hours_per_year",
    ),
  );
  await closeInspector(page);
  await page
    .getByRole("button", { name: "Pay, super and package value", exact: true, expanded: true })
    .click();
}

async function stickyGroups(page: Page): Promise<void> {
  const table = page.getByRole("region", { name: "Salary comparison" });
  await table.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
    element.scrollLeft = element.scrollWidth;
  });
  const visible = await page
    .getByRole("button", { name: "Pay, super and package value", exact: true, expanded: false })
    .evaluate((button) => {
      const range = document.createRange();
      range.selectNodeContents(button);
      const label = range.getBoundingClientRect();
      const viewport = button.closest(".table-scroll")?.getBoundingClientRect();
      return viewport !== undefined && label.left >= viewport.left && label.right <= viewport.right;
    });
  assert(visible, "Expandable group labels must stay visible after horizontal scrolling");
}

async function rosterInputFlow(page: Page): Promise<void> {
  const mode = page.getByLabel("Work-pattern editor", { exact: true });
  await mode.selectOption("true");
  await editorSection(page, "Repeating work roster (1)").locator(":scope > summary").click();
  await textField(page, "Home–work–home trips", "");
  await mode.selectOption("false");
  const readiness = page
    .getByRole("region", { name: "Live offer summary" })
    .locator(".readiness details");
  await readiness.locator("summary").click();
  await readiness
    .getByRole("button", { name: "Enter roster 1: Home–work–home trips", exact: true })
    .click();
  const journeys = page.getByLabel("Home–work–home trips", { exact: true });
  assert(await journeys.evaluate((element) => element === document.activeElement));
  await textField(page, "Home–work–home trips", "0");
  const complete = page.getByLabel("Repeating roster is complete?", { exact: true });
  await complete.selectOption("");
  await saveSettled(page);
  await mode.selectOption("false");
  await readiness
    .getByRole("button", { name: "Enter Repeating roster is complete?", exact: true })
    .click();
  assert(await complete.evaluate((element) => element === document.activeElement));
  await complete.selectOption("yes");
  await saveSettled(page);
}

async function missingInputFlow(page: Page, artifact: string): Promise<void> {
  const summary = page.getByRole("region", { name: "Live offer summary" });
  await textField(page, "Base salary or revenue (AUD)", "not a number");
  assert((await summary.textContent())?.includes("$77,480.00"));
  await page.getByRole("button", { name: "Revert field", exact: true }).click();
  await page.getByLabel("Base amount includes super?", { exact: true }).selectOption("");
  await saveSettled(page);
  assert((await summary.textContent())?.includes("Unavailable"));
  await page.getByRole("button", { name: "comparisons", exact: true }).click();
  await page.getByLabel("Saved comparison", { exact: true }).selectOption({ label: "Two offers" });
  await page
    .getByRole("button", {
      name: "Review Package value after tax, commute costs and commute time value inputs · Remote offer",
      exact: true,
    })
    .click();
  await page.getByText("Other unanswered inputs for this offer", { exact: true }).click();
  await page
    .getByRole("button", { name: "Enter Base amount includes super?", exact: true })
    .click();
  const inclusion = page.getByLabel("Base amount includes super?", { exact: true });
  assert(await inclusion.evaluate((element) => element === document.activeElement));
  assert((await inclusion.inputValue()) === "");
  await inclusion.selectOption("includes");
  await saveSettled(page);
  assert((await summary.textContent())?.includes("$77,480.00"));
  await page.evaluate(() => globalThis.scrollTo(0, 0));
  await page.screenshot({ path: `${artifact}-offer.png`, fullPage: true });
}

async function sharedInputFlow(page: Page): Promise<void> {
  const coverLabel =
    "Appropriate hospital cover for every required family member for the entire year?";
  await page.getByRole("button", { name: "Personal tax settings", exact: true }).click();
  await page.getByLabel(coverLabel, { exact: true }).selectOption("");
  await saveSettled(page);
  await page.getByRole("button", { name: "offers", exact: true }).click();
  const readiness = page
    .getByRole("region", { name: "Live offer summary" })
    .locator(".readiness details");
  if ((await readiness.getAttribute("open")) === null) {
    await readiness.locator("summary").click();
  }
  await readiness.getByRole("button", { name: `Enter ${coverLabel}`, exact: true }).click();
  const cover = page.getByLabel(coverLabel, { exact: true });
  assert(await cover.evaluate((element) => element === document.activeElement));
  await cover.selectOption("yes");
  await saveSettled(page);
  await page.getByLabel("Repayable study loan?", { exact: true }).selectOption("yes");
  await saveSettled(page);
  await page.getByLabel("Study loan scheme", { exact: true }).selectOption("other-or-multiple");
  await saveSettled(page);
  await page.getByRole("button", { name: "offers", exact: true }).click();
  const summary = page.getByRole("region", { name: "Live offer summary" });
  assert((await summary.textContent())?.includes("Tax calculation not supported"));
  assert((await summary.textContent())?.includes("$112,000.00"));
}

export { uxFlow };
