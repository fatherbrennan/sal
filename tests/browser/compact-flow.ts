import assert from "node:assert/strict";
import type { Page } from "playwright";
import { importFixture } from "../measurement/compare-flow.ts";
import { navigateTo } from "../measurement/navigation.ts";
import { compactLayout } from "./compact-layout-flow.ts";
import { repairLeave, restoreComparison, undoRow } from "./compact-state-flow.ts";
import { footerFlow } from "./footer-flow.ts";

const primaryValues = 3;
const allValues = 7;

async function compactFlow(page: Page, artifact: string): Promise<void> {
  await importFixture(page);
  await navigateTo(page, "comparisons");
  await page.getByLabel("Saved comparison", { exact: true }).selectOption("compare-a");
  assert(await page.getByLabel("Baseline offer", { exact: true }).isVisible());
  assert(await page.getByRole("combobox", { name: "Earnings scenario", exact: true }).isVisible());
  assert((await page.getByText("How to read these estimates", { exact: true }).count()) === 0);
  assert(
    (await page
      .getByText("Earned leave value is already within ordinary", { exact: false })
      .count()) === 0,
  );
  const jump = page.getByRole("combobox", { name: "Find metric or section", exact: true });
  await jump.fill("Annual leave details");
  await jump.press("ArrowDown");
  await jump.press("Enter");
  assert(
    await page.getByRole("button", { name: "Edit leave inputs", exact: true }).first().isVisible(),
  );
  await page.screenshot({ path: `${artifact}-comparison.png`, fullPage: true });
  await navigateTo(page, "offers");
  await page.getByRole("button", { name: "Remote offer", exact: true }).click();
  const summary = page.getByRole("region", { name: "Live offer summary", exact: true });
  assert((await summary.locator("dd:visible").count()) === primaryValues);
  await summary.getByText("More values", { exact: true }).click();
  assert((await summary.locator("dd:visible").count()) === allValues);
  await page.getByRole("searchbox", { name: "Filter offers", exact: true }).fill("Office");
  assert(!(await page.getByRole("button", { name: "Remote offer", exact: true }).isVisible()));
  assert(await page.getByRole("button", { name: "Office offer", exact: true }).isVisible());
  await page.screenshot({ path: `${artifact}-offer.png`, fullPage: true });
  await repairLeave(page);
  await undoRow(page);
  await restoreComparison(page);
  await compactLayout(page, artifact);
  await footerFlow(page, artifact);
}

export { compactFlow };
