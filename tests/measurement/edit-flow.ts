import assert from "node:assert/strict";
import type { Locator, Page } from "playwright";
import { navigateTo } from "./navigation.ts";

const savedLocally = /Saved locally|Changes not saved/u;

async function saveSettled(page: Page): Promise<void> {
  await page
    .getByRole("status", { name: "Save status" })
    .filter({ hasText: savedLocally })
    .waitFor();
}
async function textField(page: Page, label: string, text: string): Promise<void> {
  const field = page.getByLabel(label, { exact: true });
  await field.fill(text);
  await field.press("Tab");
  await saveSettled(page);
}
async function editFlow(page: Page): Promise<void> {
  await page.getByRole("button", { name: "New offer", exact: true }).click();
  await textField(page, "Name", "Draft offer");
  const amount = page.getByLabel("Base salary or revenue (AUD)", { exact: true });
  await amount.fill("invalid");
  await amount.press("Tab");
  await page.getByRole("alert").filter({ hasText: "last saved value" }).waitFor();
  await textField(page, "Standard paid hours per week", "40");
  assert((await amount.inputValue()) === "invalid");
  assert(
    (await page.getByRole("status", { name: "Save status" }).textContent())?.includes("not saved"),
  );
  await amount.fill(".2");
  await amount.press("Tab");
  await saveSettled(page);
  await page.getByLabel("Employment type", { exact: true }).selectOption("full-time");
  await saveSettled(page);
  assert((await page.getByRole("alert").count()) === 0);
  await relatedFieldFlow(page);
  await page.getByRole("button", { name: "Archive offer", exact: true }).click();
  await saveSettled(page);
  await page.getByRole("button", { name: "Restore offer", exact: true }).click();
  await saveSettled(page);
  await navigateTo(page, "Preferences");
  if (!(await page.getByLabel("Appearance", { exact: true }).isVisible())) {
    await page.getByText("Appearance preferences", { exact: true }).click();
  }
  await page.getByLabel("Appearance", { exact: true }).selectOption("dark");
  await saveSettled(page);
  assert((await page.locator("html").getAttribute("data-appearance")) === "dark");
  await page.getByLabel("Appearance", { exact: true }).selectOption("system");
  await saveSettled(page);
  await navigateTo(page, "Offer defaults");
  await page.getByLabel("Financial year", { exact: true }).selectOption("2025-26");
  await saveSettled(page);
  await page.getByRole("button", { name: "comparisons", exact: true }).click();
  await page.getByRole("button", { name: "New comparison", exact: true }).click();
  await saveSettled(page);
  assert((await page.getByLabel("Financial year", { exact: true }).inputValue()) === "2025-26");
  await page.getByLabel("Financial year", { exact: true }).selectOption("");
  await saveSettled(page);
  await page
    .getByText("Choose a financial year before calculating this comparison.", { exact: true })
    .waitFor();
}

async function relatedFieldFlow(page: Page): Promise<void> {
  await page.getByText("Additional job costs (0)", { exact: true }).click();
  await page.getByRole("button", { name: "Add Additional job costs", exact: true }).click();
  await textField(page, "Cash paid (AUD)", "100");
  const reimbursement = page.getByLabel("Separately reimbursed (AUD)", { exact: true });
  await reimbursement.fill("101");
  await reimbursement.press("Tab");
  await page.getByRole("alert").filter({ hasText: "last saved value" }).waitFor();
  await textField(page, "Cost", "Independent valid edit");
  assert((await reimbursement.inputValue()) === "101");
  assert((await reimbursement.getAttribute("aria-invalid")) === "true");
  await reimbursement.fill("100");
  await reimbursement.press("Tab");
  await saveSettled(page);
  assert((await reimbursement.getAttribute("aria-invalid")) === "false");
}

async function expandComparison(page: Page): Promise<void> {
  const setup = page.locator(".comparison-setup");
  if ((await setup.getAttribute("open")) === null) {
    await setup.locator("summary").click();
  }
  await (await page.locator(".group-heading button").all()).reduce(async (previous, button) => {
    await previous;
    if ((await button.getAttribute("aria-expanded")) === "false") {
      await button.press("Enter");
    }
  }, Promise.resolve());
}

function editorSection(page: Page, title: string | RegExp): Locator {
  return page
    .locator("details")
    .filter({ has: page.getByText(title, { exact: true }) })
    .last();
}

export { editFlow, editorSection, expandComparison, saveSettled, textField };
