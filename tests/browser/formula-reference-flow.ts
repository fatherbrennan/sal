import assert from "node:assert/strict";
import type { Page } from "playwright";
import { expandComparison, saveSettled, textField } from "../measurement/edit-flow.ts";

async function formulaReferenceFlow(page: Page): Promise<void> {
  await page.getByRole("button", { name: "New formula", exact: true }).click();
  await textField(page, "Formula name", "Double salary units");
  await textField(page, "Expression", "salary_in_thousands * 2");
  await page.getByLabel("Result format", { exact: true }).selectOption("money");
  await saveSettled(page);
  await page.getByLabel("Preview comparison", { exact: true }).selectOption("compare-a");
  assert(
    (await page.getByRole("region", { name: "Formula preview" }).textContent())?.includes(
      "$200.00",
    ),
  );
  await page.getByRole("button", { name: "Salary in thousands", exact: true }).click();
  await textField(page, "Formula name", "Renamed salary");
  assert((await page.getByRole("heading", { level: 2 }).textContent())?.includes("renamed_salary"));
  await page.getByRole("button", { name: "Double salary units", exact: true }).click();
  assert(
    (await page.getByLabel("Expression", { exact: true }).inputValue()) === "renamed_salary * 2",
  );
  await page.reload();
  assert(
    (await page.getByLabel("Expression", { exact: true }).inputValue()) === "renamed_salary * 2",
  );
  await page.getByRole("button", { name: "comparisons", exact: true }).click();
  await page.getByLabel("Saved comparison", { exact: true }).selectOption("compare-a");
  await expandComparison(page);
  const picker = page.getByRole("combobox", { name: "Custom formula rows", exact: true });
  await picker.fill("Double salary units");
  await page.getByRole("option", { name: "Double salary units", exact: true }).click();
  await picker.press("Escape");
  await saveSettled(page);
  const row = page
    .getByRole("rowheader", { name: "Double salary units", exact: true })
    .locator("..");
  assert((await row.textContent())?.includes("$200.00"));
  assert((await row.textContent())?.includes("$220.00"));
  await deselectInspectedFormula(page);
  await page.getByRole("button", { name: "formulas", exact: true }).click();
  await page.getByRole("button", { name: "Renamed salary", exact: true }).click();
  await textField(page, "Formula name", "Salary in thousands");
}

async function deselectInspectedFormula(page: Page): Promise<void> {
  const row = page
    .getByRole("rowheader", { name: "Double salary units", exact: true })
    .locator("..");
  const picker = page.getByRole("combobox", { name: "Custom formula rows", exact: true });
  await row
    .getByRole("button", {
      name: "Inspect Double salary units: $200.00 · Remote offer",
      exact: true,
    })
    .click();
  const inspector = page.getByRole("dialog", { name: "Calculation inspector", exact: true });
  assert((await inspector.textContent())?.includes("renamed_salary"));
  await inspector.getByRole("button", { name: "Show in comparison", exact: true }).click();
  await inspector.waitFor({ state: "hidden" });
  await picker.fill("Double salary units");
  await page.getByRole("option", { name: "Double salary units", exact: true }).click();
  await picker.press("Escape");
  await saveSettled(page);
  assert((await row.count()) === 0);
  assert(
    (await page.getByRole("button", { name: "Return to inspector", exact: true }).count()) === 0,
  );
  await page.reload();
  assert((await row.count()) === 0);
}

export { formulaReferenceFlow };
