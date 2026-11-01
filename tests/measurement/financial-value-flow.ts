import assert from "node:assert/strict";
import type { Page } from "playwright";
import { rows } from "../../src/lib/calculations/inputs.ts";
import { importFixture } from "./compare-flow.ts";
import { editorSection, textField } from "./edit-flow.ts";
import { backupFixture } from "./fixtures.ts";
import { amountButton, closeInspector, followValue, formulaText } from "./inspector-flow.ts";

const terms = "Flexible start; confirm overtime and bonus repayment terms.";
const collapsed = { exact: true, expanded: false };

function financialFixture() {
  const fixture = backupFixture();
  const first = fixture.records.find((record) => record.id === "offer-a");
  const second = fixture.records.find((record) => record.id === "offer-b");
  assert(first !== undefined && second !== undefined);
  first.items = {
    ...first.items,
    roster: [...rows(second, "roster")],
    perks: [{ id: "unknown-perk", fields: { label: "Gym", amount: "", frequency: "annual" } }],
  };
  second.fields = { ...second.fields, costMethod: "ato" };
  return fixture;
}

async function financialValueFlow(page: Page, artifact?: string): Promise<void> {
  await importFixture(page, financialFixture());
  await page.getByRole("button", { name: "offers", exact: true }).click();
  await page.getByRole("button", { name: "Remote offer", exact: true }).click();
  await editorSection(page, "Offer conditions and fit").locator(":scope > summary").click();
  await textField(page, "Offer conditions and fit", terms);
  await page.getByRole("button", { name: "comparisons", exact: true }).click();
  await page.getByLabel("Saved comparison", { exact: true }).selectOption({ label: "Two offers" });
  await page.getByRole("button", { name: "Collapse details", exact: true }).click();
  const table = page.getByRole("region", { name: "Salary comparison" });
  await table.getByRole("button", { name: "Job costs and adjusted values", ...collapsed }).click();
  const row = (label: string) =>
    table
      .getByRole("row")
      .filter({ has: page.getByRole("rowheader", { name: label, exact: true }) });
  const financial = "Cash + super after tax and all job costs";
  assert((await row(financial).getByRole("cell").first().textContent())?.includes("$87,340.80"));
  assert(
    (
      await row("Package value after tax and all job costs").getByRole("cell").first().textContent()
    )?.includes("Unavailable"),
  );
  await table.getByRole("button", { name: "Tax estimates and assumptions", ...collapsed }).click();
  await table.getByRole("button", { name: "Pay, super and package value", ...collapsed }).click();
  await table.getByRole("button", { name: "Work and commuting", ...collapsed }).click();
  assert((await table.textContent())?.includes("Mixed cost bases:"));
  assert((await table.textContent())?.includes(terms));
  assert((await table.textContent())?.includes("More cash · same work + commute hours"));
  await amountButton(page, financial).click();
  const popup = page.getByRole("dialog");
  await followValue(popup, "annual_net_financial_value");
  assert(
    (await formulaText(popup)).includes("annual_cash_after_tax + annual_net_super_contributions"),
  );
  await closeInspector(page);
  await table
    .getByRole("button", { name: "Bonuses, commissions and one-offs", ...collapsed })
    .click();
  assert(
    (
      await row("Target-dependent share of cash after tax (%)")
        .getByRole("cell")
        .first()
        .textContent()
    )?.includes("8.07%"),
  );
  if (artifact !== undefined) {
    await table.evaluate((element) => {
      element.scrollLeft = 0;
    });
    await page.evaluate(() => globalThis.scrollTo(0, 0));
    await page.screenshot({ path: `${artifact}-financial.png`, fullPage: true });
  }
}

export { financialValueFlow };
