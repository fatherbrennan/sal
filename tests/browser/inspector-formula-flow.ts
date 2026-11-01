import assert from "node:assert/strict";
import type { Locator, Page } from "playwright";
import {
  amountButton,
  closeInspector,
  followValue,
  formulaText,
} from "../measurement/inspector-flow.ts";

async function formulaLayout(formula: Locator): Promise<string> {
  const result = await formula.evaluate((element) => {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const characters: { text: string; box: DOMRect }[] = [];
    let node = walker.nextNode();
    while (node) {
      if (!node.parentElement?.closest("[role=tooltip]")) {
        const text = node.textContent ?? "";
        for (let offset = 0; offset < text.length; offset += 1) {
          const range = document.createRange();
          range.setStart(node, offset);
          range.setEnd(node, offset + 1);
          characters.push({ text: text.charAt(offset), box: range.getBoundingClientRect() });
        }
      }
      node = walker.nextNode();
    }
    const gaps = characters.flatMap((character, index) => {
      const next = characters[index + 1];
      if (
        next &&
        (character.text === "(" || next.text === ")") &&
        Math.abs(next.box.y - character.box.y) < 1
      ) {
        return [next.box.left - character.box.right];
      }
      return [];
    });
    return { text: characters.map((character) => character.text).join(""), gaps };
  });
  assert(
    result.gaps.every((gap) => Math.abs(gap) <= 1),
    `Unexpected bracket gaps: ${result.gaps}`,
  );
  return result.text;
}

async function inspectorFormulaFlow(page: Page, artifact: string): Promise<void> {
  await amountButton(
    page,
    "Package value after tax, commute costs and commute time value",
    1,
  ).click();
  const panel = page.getByRole("dialog", { name: "Calculation inspector" });
  await followValue(panel, "annual_after_tax_travel_time_value");
  await followValue(panel, "net_financial_value_per_paid_hour");
  const parent = panel.getByRole("region", { name: "Position in the previous calculation" });
  await compactHighlight(parent);
  assert(
    (await formulaLayout(parent.locator(".source-formula"))) ===
      "annual_after_tax_travel_time_value = net_financial_value_per_paid_hour * annual_commute_hours",
  );
  const context = panel
    .locator("details")
    .filter({ has: page.getByText("Context and assumptions", { exact: true }) });
  assert((await context.getAttribute("open")) === null);
  await context.locator("summary").focus();
  await page.keyboard.press("Enter");
  assert((await context.textContent())?.includes("Use this offer's own hourly rate."));
  assert(
    await context.getByText("Use this offer's own hourly rate.", { exact: false }).isVisible(),
  );
  await panel.screenshot({ path: `${artifact}-formula-context.png` });
  await followValue(panel, "annual_net_financial_value");
  await followValue(panel, "annual_net_super_contributions");
  const superFormula =
    "annual_net_super_contributions = (annual_employer_super + annual_salary_sacrifice) * (1 - 15 / 100) + annual_personal_super_contribution";
  assert((await formulaText(panel)) === superFormula);
  await followValue(panel, "annual_employer_super");
  const selectedParent = panel.getByRole("region", {
    name: "Position in the previous calculation",
  });
  assert((await formulaLayout(selectedParent.locator(".source-formula"))) === superFormula);
  const sum = "annual_employer_super = sum(selected_pay_item_super_before_cap)";
  assert((await formulaText(panel)) === sum);
  await followValue(panel, "selected_pay_item_super_before_cap");
  const sumParent = panel.getByRole("region", { name: "Position in the previous calculation" });
  assert((await formulaLayout(sumParent.locator(".source-formula"))) === sum);
  await page.setViewportSize({ width: 320, height: 800 });
  assert((await formulaLayout(sumParent.locator(".source-formula"))) === sum);
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ path: `${artifact}-formula-narrow.png`, fullPage: true });
  await closeInspector(page);
  await page.setViewportSize({ width: 1920, height: 1080 });
}

async function compactHighlight(parent: Locator): Promise<void> {
  const selected = parent.locator(".source-formula button.active");
  const dimensions = await selected.evaluate((element) => ({
    height: element.getBoundingClientRect().height,
    fontSize: Number.parseFloat(getComputedStyle(element).fontSize),
  }));
  const maximumLineHeight = 1.5;
  assert(
    dimensions.height <= dimensions.fontSize * maximumLineHeight,
    `Formula highlight must fit one compact text line: ${JSON.stringify(dimensions)}`,
  );
}

export { inspectorFormulaFlow };
