import assert from "node:assert/strict";
import type { Locator, Page } from "playwright";
import { editorSection, saveSettled, textField } from "./edit-flow.ts";
import { navigateTo } from "./navigation.ts";

const hoursLabel = "Standard paid hours per week";

async function openDetails(section: Locator): Promise<void> {
  if ((await section.getAttribute("open")) === null) {
    await section.locator(":scope > summary").click();
  }
}

async function openDefaults(page: Page): Promise<void> {
  await navigateTo(page, "Offer defaults");
  const section = page
    .locator("details")
    .filter({ has: page.getByLabel(hoursLabel, { exact: true }) });
  await openDetails(section);
}

async function defaultsFlow(page: Page): Promise<void> {
  await page.getByRole("button", { name: "New offer", exact: true }).click();
  await page.getByRole("heading", { name: "New offer", exact: true }).waitFor();
  const startingHours = await page.getByLabel(hoursLabel, { exact: true }).inputValue();
  assert(startingHours === "38", `Expected 38 inherited hours, received ${startingHours}`);
  assert((await page.getByLabel("Employment type", { exact: true }).inputValue()) === "full-time");
  assert(
    (await page.getByLabel("Base amount includes super?", { exact: true }).inputValue()) === "",
  );
  await textField(page, "Name", "Overridden defaults");
  await textField(page, hoursLabel, "35");
  await page.getByRole("button", { name: "New offer", exact: true }).click();
  await page.getByRole("heading", { name: "New offer", exact: true }).waitFor();
  await textField(page, "Name", "Inherited defaults");
  await openDefaults(page);
  await textField(page, hoursLabel, "40");
  await page.reload();
  await navigateTo(page, "offers");
  await page.getByRole("button", { name: "Inherited defaults", exact: true }).click();
  assert((await page.getByLabel(hoursLabel, { exact: true }).inputValue()) === "40");
  await page.getByRole("button", { name: "Overridden defaults", exact: true }).click();
  const hours = page.getByLabel(hoursLabel, { exact: true });
  assert((await hours.inputValue()) === "35");
  await page
    .locator(".field")
    .filter({ has: hours })
    .getByRole("button", { name: "Use shared default", exact: true })
    .click();
  await saveSettled(page);
  assert((await hours.inputValue()) === "40");
  await textField(page, hoursLabel, "");
  assert((await hours.inputValue()) === "");
  await page
    .locator(".field")
    .filter({ has: hours })
    .getByRole("button", { name: "Use shared default", exact: true })
    .click();
  await saveSettled(page);
  await calendarOverrides(page);
  await profileOverrides(page);
  await openDefaults(page);
  await textField(page, hoursLabel, "38");
  await page.getByRole("button", { name: "offers", exact: true }).click();
  await page.getByRole("button", { name: "Inherited defaults", exact: true }).click();
  assert((await page.getByLabel(hoursLabel, { exact: true }).inputValue()) === "38");
  await page.getByRole("button", { name: "Simple salary", exact: true }).click();
  assert((await page.getByLabel(hoursLabel, { exact: true }).inputValue()) === "40");
}

async function profileOverrides(page: Page): Promise<void> {
  const tax = page.locator("details").filter({ hasText: "Personal tax overrides (" });
  await openDetails(tax);
  await tax.getByRole("button", { name: "Add Personal tax overrides", exact: true }).click();
  const incomeLabel = "Other annual assessable income before deductions (AUD)";
  const income = tax.getByLabel(incomeLabel, { exact: true });
  assert((await income.inputValue()) === "0");
  await income.fill("500");
  await income.press("Tab");
  await saveSettled(page);
  await page.getByRole("button", { name: "Personal tax settings", exact: true }).click();
  await openDetails(editorSection(page, "Other income and deductions"));
  await textField(page, incomeLabel, "200");
  await page.getByRole("button", { name: "offers", exact: true }).click();
  await page.getByRole("button", { name: "Overridden defaults", exact: true }).click();
  await openDetails(tax);
  assert((await income.inputValue()) === "500");
  await income.fill("");
  await income.press("Tab");
  await saveSettled(page);
  assert((await income.inputValue()) === "");
  await page
    .locator(".field")
    .filter({ has: page.getByLabel(incomeLabel, { exact: true }) })
    .getByRole("button", { name: "Use shared default", exact: true })
    .click();
  await saveSettled(page);
  assert((await income.inputValue()) === "200");
  await page.getByRole("button", { name: "Personal tax settings", exact: true }).click();
  await openDetails(editorSection(page, "Other income and deductions"));
  await textField(page, incomeLabel, "0");
  await page.getByRole("button", { name: "offers", exact: true }).click();
  await page.getByRole("button", { name: "Overridden defaults", exact: true }).click();
  await openDetails(tax);
  assert((await income.inputValue()) === "0");
}

async function calendarOverrides(page: Page): Promise<void> {
  await page.getByLabel("Work-pattern editor", { exact: true }).selectOption("true");
  const roster = editorSection(page, "Repeating work roster (5)");
  await roster.locator(":scope > summary").click();
  const firstDay = roster.locator("fieldset").first();
  await firstDay.getByLabel("Attendance", { exact: true }).selectOption("remote");
  await saveSettled(page);
  assert((await firstDay.getByLabel("Home–work–home trips", { exact: true }).inputValue()) === "0");
  await firstDay.getByLabel("Attendance", { exact: true }).selectOption("onsite");
  await saveSettled(page);
  assert((await firstDay.getByLabel("Home–work–home trips", { exact: true }).inputValue()) === "1");
  const workHours = roster
    .getByLabel("Work hours, excluding unpaid break", { exact: true })
    .first();
  assert((await workHours.inputValue()) === "8");
  await workHours.fill("9");
  await workHours.press("Tab");
  await saveSettled(page);
  await page.getByRole("button", { name: "Use shared work pattern", exact: true }).click();
  await saveSettled(page);
  assert((await workHours.inputValue()) === "8");
  await page.getByText("Public holidays and leave", { exact: true }).click();
  const holidays = editorSection(page, "Applicable public holidays (29)");
  await holidays.locator(":scope > summary").click();
  assert(
    (await holidays.locator("label").last().textContent()) ===
      "Applicable holiday dates have been checked?",
  );
  const label = holidays.getByLabel("Holiday and locality", { exact: true }).first();
  await label.fill("Custom holiday");
  await label.press("Tab");
  await saveSettled(page);
  await holidays
    .locator(":scope > p")
    .getByRole("button", { name: "Use shared default", exact: true })
    .click();
  await saveSettled(page);
  assert((await label.inputValue()) === "Labour Day");
}

export { defaultsFlow };
