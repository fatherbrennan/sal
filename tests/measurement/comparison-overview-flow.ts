import assert from "node:assert/strict";
import type { Page } from "playwright";
import { saveSettled } from "./edit-flow.ts";
import { amountButton, closeInspector, followValue } from "./inspector-flow.ts";
import { selectScenario } from "./navigation.ts";
import { packageValueFlow } from "./package-value-flow.ts";

const bankLabel = /^Estimated payslip cash after deductions/u;
const upsideLabel = /^Target increase: cash after tax/u;
const monthlyLabel = /\/ month average/u;
const keyResultCount = 1;

async function comparisonOverviewFlow(page: Page): Promise<void> {
  await packageValueFlow(page);
  const table = page.getByRole("region", { name: "Salary comparison", exact: true });
  await [
    "Pay, super and package value",
    "Bonuses, commissions and one-offs",
    "Tax estimates and assumptions",
  ].reduce(async (previous, name) => {
    await previous;
    await table.getByRole("button", { name, exact: true, expanded: false }).click();
  }, Promise.resolve());
  await amountButton(page, "Package value after tax, commute costs and commute time value").click();
  const context = page.getByRole("dialog").getByText("Context and assumptions", { exact: true });
  await context.click();
  assert(
    await page.getByRole("dialog").getByText("it is not bank cash", { exact: false }).isVisible(),
  );
  await closeInspector(page);
  assert((await table.textContent())?.includes("Roster differs from standard paid hours"));
  assert((await table.textContent())?.includes("No leave dates entered"));
  assert((await table.locator(".key-result:visible").count()) === keyResultCount);
  await monthlyFlow(page);
  const popup = page.getByRole("dialog");
  const bank = table
    .getByRole("row")
    .filter({ has: page.getByRole("rowheader", { name: bankLabel }) });
  assert((await bank.textContent())?.includes("Pay frequency: fortnightly"));
  assert((await bank.textContent())?.includes("1 July 2026–30 June 2027"));
  await bank.getByRole("cell").first().getByRole("button").click();
  assert((await popup.textContent())?.includes("period_bank_cash_estimate"));
  await closeInspector(page);
  const upside = table
    .getByRole("row")
    .filter({ has: page.getByRole("rowheader", { name: upsideLabel }) });
  assert((await upside.getByRole("cell").first().textContent())?.includes("$6,800.00"));
  assert((await upside.getByRole("cell").nth(1).textContent())?.includes("$0.00"));
  const setup = page.locator(".comparison-setup");
  await setup.locator(":scope > summary").click();
  await selectScenario(page, "Guaranteed · including one-offs");
  assert((await table.getByRole("button", { name: monthlyLabel }).count()) === 0);
  await selectScenario(page, "Guaranteed · recurring");
  await page.getByLabel("Financial year", { exact: true }).selectOption("2025-26");
  await saveSettled(page);
  assert((await bank.textContent())?.includes("1 July–23 September 2025"));
  assert((await bank.textContent())?.includes("24 September 2025–30 June 2026"));
  await page.getByLabel("Financial year", { exact: true }).selectOption("2026-27");
  await saveSettled(page);
  await setup.locator(":scope > summary").click();
}

async function monthlyFlow(page: Page): Promise<void> {
  const monthly = page.getByRole("button", { name: "$6,456.67 / month average", exact: true });
  await monthly.focus();
  await monthly.press("Enter");
  const popup = page.getByRole("dialog");
  assert((await popup.textContent())?.includes("not a payslip forecast"));
  await followValue(popup, "annual_cash__annual_cash_after_job_costs");
  const returnLabel = await page
    .locator("td:has([data-inspected]) .equation-trigger")
    .first()
    .getAttribute("aria-label");
  assert(returnLabel);
  await closeInspector(page);
  await popup.waitFor({ state: "hidden" });
  assert(
    await page
      .getByRole("button", { name: returnLabel, exact: true })
      .evaluate((element) => element === document.activeElement),
  );
  await monthly.click();
  await closeInspector(page);
  await popup.waitFor({ state: "hidden" });
  assert(await monthly.evaluate((element) => element === document.activeElement));
}

export { comparisonOverviewFlow };
