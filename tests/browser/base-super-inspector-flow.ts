import assert from "node:assert/strict";
import type { Page } from "playwright";
import { importFixture } from "../measurement/compare-flow.ts";
import {
  amountButton,
  closeInspector,
  followValue,
  formulaText,
} from "../measurement/inspector-flow.ts";
import { selectScenario } from "../measurement/navigation.ts";

async function baseSuperInspectorFlow(page: Page): Promise<void> {
  await importFixture(page);
  await page.getByRole("button", { name: "comparisons", exact: true }).click();
  await page.getByLabel("Saved comparison", { exact: true }).selectOption({ label: "Two offers" });
  const setup = page.locator(".comparison-setup");
  await setup.locator("summary").click();
  await selectScenario(page, "Target · recurring");
  await page.getByRole("button", { name: "Pay, super and package value", exact: true }).click();
  const base = amountButton(page, "Employer super contributions on base pay");
  assert((await base.textContent()) === "$12,000.00");
  await base.click();
  const panel = page.getByRole("dialog", { name: "Calculation inspector" });
  const baseFormula = "annual_base_employer_super = annual_base_super_before_cap";
  assert((await formulaText(panel)) === baseFormula);
  await followValue(panel, "annual_base_super_before_cap");
  const parent = panel.getByRole("region", { name: "Position in the previous calculation" });
  assert((await parent.textContent())?.includes(baseFormula));
  assert(!(await panel.getByRole("navigation").textContent())?.includes("annual_employer_super"));
  await closeInspector(page);
  await page
    .getByRole("button", { name: "Bonuses, commissions and one-offs", exact: true })
    .click();
  const bonus = amountButton(page, "Employer super contributions on bonuses and commissions");
  assert((await bonus.textContent()) === "$1,200.00");
  await bonus.click();
  assert(
    (await formulaText(panel)) ===
      "annual_bonus_employer_super = annual_employer_super - annual_base_employer_super",
  );
  await followValue(panel, "annual_base_employer_super");
  assert((await formulaText(panel)) === baseFormula);
  await closeInspector(page);
}

export { baseSuperInspectorFlow };
