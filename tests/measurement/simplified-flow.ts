import assert from "node:assert/strict";
import type { Page } from "playwright";
import { expandComparison, saveSettled, textField } from "./edit-flow.ts";

async function simplifiedFlow(page: Page): Promise<void> {
  await page.getByRole("button", { name: "New offer", exact: true }).click();
  await page.getByLabel("Name", { exact: true }).waitFor();
  assert((await page.getByLabel("TFN supplied to this payer?", { exact: true }).count()) === 0);
  assert((await page.getByLabel("Employer or client", { exact: true }).count()) === 0);
  assert((await page.getByLabel("Revenue GST basis", { exact: true }).count()) === 0);
  assert(
    (await page.getByLabel("Annual paid / billable hours or days", { exact: true }).count()) === 0,
  );
  assert((await page.getByLabel("Name", { exact: true }).count()) === 1);
  await textField(page, "Name", "Simple salary");
  await page.getByLabel("Employment type", { exact: true }).selectOption("full-time");
  await saveSettled(page);
  await textField(page, "Base salary or revenue (AUD)", "100000");
  await page.getByLabel("Base amount includes super?", { exact: true }).selectOption("excludes");
  await saveSettled(page);
  await textField(page, "Standard paid hours per week", "40");
  await page.getByText("Extra contributions and payroll settings", { exact: true }).click();
  await page
    .getByLabel("Claim the tax-free threshold from this payer?", { exact: true })
    .selectOption("yes");
  await saveSettled(page);
  await page.getByText("Extra contributions and payroll settings", { exact: true }).click();
  await page.screenshot({ path: "test-results/sal-simplified-offer.png", fullPage: true });
  await personalFlow(page);
  await simpleComparison(page);
  await page.getByRole("button", { name: "offers", exact: true }).click();
}

async function personalFlow(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Personal tax settings", exact: true }).click();
  await page.getByLabel("Established full-year household", { exact: true }).waitFor();
  assert((await page.getByLabel("Name", { exact: true }).count()) === 0);
  assert(
    (await page.getByLabel("Full-year Australian tax resident?", { exact: true }).count()) === 0,
  );
  assert(
    (await page
      .getByLabel("Established spouse taxable income (whole AUD)", { exact: true })
      .count()) === 0,
  );
  await page.getByLabel("Established full-year household", { exact: true }).selectOption("single");
  await saveSettled(page);
  await page
    .getByLabel(
      "Appropriate hospital cover for every required family member for the entire year?",
      { exact: true },
    )
    .selectOption("yes");
  await saveSettled(page);
  await page.getByLabel("Repayable study loan?", { exact: true }).selectOption("no");
  await saveSettled(page);
  await page.screenshot({ path: "test-results/sal-simplified-profile.png", fullPage: true });
}

async function simpleComparison(page: Page): Promise<void> {
  await page.getByRole("button", { name: "comparisons", exact: true }).click();
  await page.getByRole("button", { name: "New comparison", exact: true }).click();
  await saveSettled(page);
  const offers = page.getByRole("combobox", { name: "Offers to compare", exact: true });
  await offers.fill("Simple salary");
  await page
    .getByRole("listbox", { name: "Offers to compare", exact: true })
    .getByRole("option", { name: "Simple salary", exact: true })
    .click();
  await saveSettled(page);
  await offers.press("Escape");
  const table = page.getByRole("region", { name: "Salary comparison" });
  const cashRow = table
    .getByRole("rowheader", { name: "Cash after tax", exact: true })
    .locator("..");
  await expandComparison(page);
  assert((await cashRow.textContent())?.includes("$77,800.00"));
  await page.getByText("Simple salary — breakdown and limitations", { exact: true }).click();
  await page
    .getByRole("button", {
      name: "Estimated payslip cash after deductions per fortnight",
      exact: true,
    })
    .waitFor();
  assert(
    (await page
      .getByText("TFN declaration supplied is outside this component.", { exact: true })
      .count()) === 0,
  );
}

export { simplifiedFlow };
