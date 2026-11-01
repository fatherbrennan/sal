import assert from "node:assert/strict";
import type { Page } from "playwright";
import { readBackup } from "../../src/lib/data/schema.ts";
import { comparisonColors, deltaColor, unavailableDifference } from "./comparison-colors.ts";
import { derivedComparisonFlow } from "./derived-comparison-flow.ts";
import { expandComparison, saveSettled, textField } from "./edit-flow.ts";
import { backupFixture } from "./fixtures.ts";
import { navigateTo, selectScenario } from "./navigation.ts";

const oneOffRow = /^One-off payments and costs/u;
const pageScroll = 300;
const remainingChoices = /version choices remaining/u;

async function importFixture(page: Page, fixture = backupFixture()): Promise<void> {
  await page.locator("#calculator-toggle:enabled").waitFor({ state: "attached" });
  await navigateTo(page, "Backups");
  await page.getByLabel("Preview a JSON backup").setInputFiles({
    name: "fixture.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(fixture)),
  });
  await page.getByRole("heading", { name: "Import preview", exact: true }).waitFor();
  await fixture.records.reduce(async (previous, record) => {
    await previous;
    const conflict = page.getByText(`${record.name || record.kind} — choose a version`, {
      exact: true,
    });
    if (await conflict.count()) {
      await conflict.click();
      await conflict.locator("..").getByLabel("Use backup version", { exact: true }).check();
    }
  }, Promise.resolve());
  await page.getByRole("button", { name: "Apply selected import", exact: true }).click();
  await saveSettled(page);
}
async function comparisonDetailsFlow(page: Page): Promise<void> {
  await expandComparison(page);
  await derivedComparisonFlow(page);
  await expandComparison(page);
  await comparisonColors(page);
  const table = page.getByRole("region", { name: "Salary comparison" });
  const cashRow = table
    .getByRole("rowheader", { name: "Cash after tax", exact: true })
    .locator("..");
  assert((await cashRow.textContent())?.includes("$77,480.00"));
  await selectScenario(page, "Target · recurring");
  assert((await cashRow.textContent())?.includes("$84,280.00"));
  await selectScenario(page, "Guaranteed · including one-offs");
  await selectScenario(page, "Target · including one-offs");
  await selectScenario(page, "Guaranteed · recurring");
  await page.getByLabel("Baseline offer", { exact: true }).selectOption("offer-b");
  await saveSettled(page);
  await page.getByText("Remote offer — breakdown and limitations", { exact: true }).click();
  const breakdown = page
    .getByText("Remote offer — breakdown and limitations", { exact: true })
    .locator("..");
  await breakdown.getByText("Without-offer baseline and taxable income", { exact: true }).click();
  await selectScenario(page, "Guaranteed · including one-offs");
  assert((await table.getByRole("row", { name: oneOffRow }).textContent())?.includes("$580.00"));
  await selectScenario(page, "Guaranteed · recurring");
  assert((await page.getByText("Final assessed tax", { exact: true }).count()) > 0);
  await breakdown
    .getByText("Representative payslip estimates per standard paid hour", { exact: true })
    .click();
  assert(
    (await breakdown
      .getByText("Estimated payslip cash after deductions per standard paid hour", { exact: true })
      .count()) > 0,
  );
  await checkViewport(page);
  await checkTableScroll(page);
  await page.screenshot({ path: "test-results/sal-comparison-desktop.png", fullPage: true });
  await page.getByRole("button", { name: "offers", exact: true }).click();
  await page.getByRole("button", { name: "Remote offer", exact: true }).click();
  await unavailableDifference(page);
  await textField(page, "Base salary or revenue (AUD)", "123200");
  await page.getByRole("button", { name: "comparisons", exact: true }).click();
  await page.getByLabel("Saved comparison", { exact: true }).selectOption({ label: "Two offers" });
  await expandComparison(page);
  assert((await cashRow.textContent())?.includes("$84,280.00"));
  await deltaColor(page, "Package value before tax", "muted");
}
async function checkTableScroll(page: Page): Promise<void> {
  const table = page.getByRole("region", { name: "Salary comparison" });
  await table.evaluate((element, distance) => {
    globalThis.scrollTo(0, element.getBoundingClientRect().top + scrollY + distance);
  }, pageScroll);
  assert(await page.evaluate(() => scrollY > 0));
  assert(await table.evaluate((element) => element.scrollHeight <= element.clientHeight + 1));
  assert(await table.evaluate((element) => element.scrollTop === 0));
}
async function checkViewport(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    viewport: innerWidth,
    elements: [...document.querySelectorAll("main *")]
      .filter(
        (element) =>
          element.getBoundingClientRect().right > innerWidth && !element.closest(".table-scroll"),
      )
      .map((element) => ({
        tag: element.tagName,
        text: element.textContent,
        right: element.getBoundingClientRect().right,
      })),
  }));
  assert(overflow.width <= overflow.viewport, JSON.stringify(overflow));
}
async function backupFlow(page: Page): Promise<void> {
  await navigateTo(page, "Backups");
  await page.getByRole("button", { name: "Prepare JSON backup", exact: true }).click();
  const download = page.getByRole("link", { name: "Download sal-backup.json" });
  const href = await download.getAttribute("href");
  assert(href !== null);
  const exported: unknown = await page.evaluate(async () => {
    const link = document.querySelector("a[download]");
    if (!(link instanceof HTMLAnchorElement)) {
      throw new Error("Missing backup link");
    }
    return await (await fetch(link.href)).json();
  });
  assert(readBackup(exported).records.some((record) => record.name === "Two offers"));
  await page.getByLabel("Preview a JSON backup").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"schemaVersion":99}'),
  });
  await page.getByRole("alert").filter({ hasText: "Existing data was not changed" }).waitFor();
  await page.getByLabel("Preview a JSON backup").setInputFiles({
    name: "fixture.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(backupFixture())),
  });
  await page.getByRole("heading", { name: "Import preview", exact: true }).waitFor();
  assert(
    await page.getByRole("button", { name: "Apply selected import", exact: true }).isDisabled(),
  );
  assert(await page.getByText(remainingChoices).isVisible());
  await page.getByRole("button", { name: "Cancel import", exact: true }).click();
}

export { backupFlow, comparisonDetailsFlow, importFixture };
