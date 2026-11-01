import assert from "node:assert/strict";
import type { Page } from "playwright";
import { saveSettled, textField } from "../measurement/edit-flow.ts";
import { topLeftTooltip } from "./tooltip-flow.ts";

async function duplicateFormula(page: Page): Promise<void> {
  const duplicate = page.getByRole("button", { name: "Duplicate formula", exact: true });
  assert((await duplicate.textContent())?.trim() === "⧉");
  await topLeftTooltip(duplicate, "Duplicate formula");
  await duplicate.focus();
  await duplicate.press("Enter");
  await saveSettled(page);
  const name = page.getByLabel("Formula name", { exact: true });
  assert((await name.inputValue()) === "Copy of Salary in thousands");
  assert(await name.evaluate((element) => element === document.activeElement));
  const expression = page.getByLabel("Expression", { exact: true });
  assert((await expression.inputValue()) === "annual_base_cash / 1000");
  assert((await page.getByLabel("Result format", { exact: true }).inputValue()) === "money");
  assert((await page.getByLabel("Preferred result", { exact: true }).inputValue()) === "higher");
  await textField(page, "Expression", "42");
  await page.reload();
  assert((await name.inputValue()) === "Copy of Salary in thousands");
  assert((await expression.inputValue()) === "42");
  await page.getByRole("button", { name: "Salary in thousands", exact: true }).click();
  assert((await expression.inputValue()) === "annual_base_cash / 1000");
}

export { duplicateFormula };
