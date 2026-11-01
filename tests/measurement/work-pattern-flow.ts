import assert from "node:assert/strict";
import type { Locator, Page } from "playwright";
import { editorSection, saveSettled, textField } from "./edit-flow.ts";
import { openEveryEquation } from "./equation-flow.ts";

async function createPattern(page: Page): Promise<Locator> {
  await page.getByRole("button", { name: "offers", exact: true }).click();
  await page.getByRole("button", { name: "New offer", exact: true }).click();
  await page.getByRole("heading", { name: "New offer", exact: true }).waitFor();
  await textField(page, "Name", "Work pattern checks");
  const order = (await page.locator(".editor > details > summary").allTextContents()).map((title) =>
    title.trim(),
  );
  const pay = order.findIndex((title) => title.startsWith("Pay details"));
  assert(order[pay + 1] === "Work pattern");
  assert(order[pay + 2]?.startsWith("Paid annual leave"));
  assert(
    order[order.findIndex((title) => title.startsWith("Paid annual leave")) + 1]?.startsWith(
      "Commuting costs",
    ),
  );
  assert(order.at(-1) === "Estimate scope and saved settings");
  const costs = order.indexOf("Additional job costs (0)");
  assert(costs > order.indexOf("Personal perk values (0)"));
  assert(costs < order.indexOf("Extra contributions and payroll settings"));
  const payDetails = editorSection(page, "Pay details");
  const bonus = payDetails.getByText("Additional cash bonuses and commissions (0)", {
    exact: true,
  });
  assert((await bonus.count()) === 1);
  assert(
    (await editorSection(page, "Additional cash bonuses and commissions (0)").getAttribute(
      "open",
    )) === null,
  );
  await page.getByLabel("Quoted unit", { exact: true }).focus();
  await page.keyboard.press("Tab");
  assert(
    await page
      .getByLabel("Base salary or revenue (AUD)", { exact: true })
      .evaluate((control) => control === document.activeElement),
  );
  const pattern = page.getByText("Work pattern", { exact: true }).locator("..");
  assert((await pattern.textContent())?.includes("17:06"));
  await openEveryEquation(
    page,
    pattern.locator(
      ".pattern-summary > button, p.hint > button, .day-times > p > button, .calendar-summary > p > button",
    ),
  );
  return pattern;
}

async function workPatternFlow(page: Page, artifact: string): Promise<void> {
  const pattern = await createPattern(page);
  await page.getByLabel("Monday attendance", { exact: true }).selectOption("remote");
  await saveSettled(page);
  assert((await pattern.textContent())?.includes("4 on-site days · 4 round trips"));
  await page
    .getByRole("button", { name: "Make repeating pattern fully remote", exact: true })
    .click();
  await saveSettled(page);
  await page
    .getByText("No commuting in this calendar. Distance, time and fuel inputs are not needed.", {
      exact: true,
    })
    .waitFor();
  await page.getByText("Public holidays and leave", { exact: true }).click();
  await page.getByText("Dated work and leave exceptions (0)", { exact: true }).click();
  await page
    .getByRole("button", { name: "Add Dated work and leave exceptions", exact: true })
    .click();
  const exception = editorSection(page, "Dated work and leave exceptions (1)");
  await textField(page, "Date", "2026-07-01");
  await page.getByLabel("Exception type", { exact: true }).selectOption("work");
  await textField(page, "Worked hours on this date", "7.6");
  await exception.getByLabel("Attendance", { exact: true }).selectOption("onsite");
  await saveSettled(page);
  assert((await exception.getByLabel("Return journeys", { exact: true }).inputValue()) === "1");
  const calendar = ((await pattern.locator(".calendar-summary").textContent()) ?? "").replace(
    /\s+/gu,
    " ",
  );
  assert(calendar.includes("1 on-site days · 1 round trips"), calendar);
  await page
    .getByRole("button", { name: "Make repeating pattern fully remote", exact: true })
    .click();
  await saveSettled(page);
  assert((await page.getByLabel("Date", { exact: true }).inputValue()) === "2026-07-01");
  await page.getByText("Public holidays and leave", { exact: true }).click();
  await weeklyEdits(page);
  await page.evaluate(() => globalThis.scrollTo(0, 0));
  await page.screenshot({ path: `${artifact}-weekly.png`, fullPage: true });
  await customPattern(page);
  await page.evaluate(() => globalThis.scrollTo(0, 0));
  await page.screenshot({ path: `${artifact}-custom.png`, fullPage: true });
  await page.getByRole("button", { name: "Use shared work pattern", exact: true }).click();
  await saveSettled(page);
  await page.getByLabel("Work-pattern editor", { exact: true }).selectOption("false");
  await page.getByText("Public holidays and leave", { exact: true }).click();
  await page.getByText("Dated work and leave exceptions (1)", { exact: true }).click();
  assert((await page.getByLabel("Date", { exact: true }).inputValue()) === "2026-07-01");
}

async function weeklyEdits(page: Page): Promise<void> {
  await page.getByText("Edit Monday times", { exact: true }).click();
  await textField(page, "Monday: Work hours, excluding unpaid break", "4");
  await page.getByText("Common workday times", { exact: true }).click();
  assert(
    (await page
      .getByLabel("Every workday: Work hours, excluding unpaid break", { exact: true })
      .inputValue()) === "",
  );
  await textField(page, "Every workday: Work hours, excluding unpaid break", "7.6");
  const breakStart = page.getByLabel("Every workday: Unpaid break starts (HH:MM)", { exact: true });
  await breakStart.fill("23:00");
  await breakStart.press("Tab");
  await page
    .getByRole("alert")
    .filter({ hasText: "unpaid break" })
    .filter({ hasText: "last saved value" })
    .waitFor();
  assert(await page.getByLabel("Work-pattern editor", { exact: true }).isDisabled());
  await textField(page, "Monday: Work hours, excluding unpaid break", "20");
  assert(await breakStart.isVisible());
  assert((await breakStart.inputValue()) === "23:00");
  await page.getByRole("button", { name: "Revert field", exact: true }).first().click();
  await page.getByRole("button", { name: "Revert field", exact: true }).click();
  await page.getByLabel("Friday attendance", { exact: true }).selectOption("off");
  await saveSettled(page);
  await page.getByLabel("Saturday attendance", { exact: true }).selectOption("onsite");
  await saveSettled(page);
  assert((await page.getByLabel("Saturday attendance", { exact: true }).inputValue()) === "onsite");
  await page.getByRole("button", { name: "Use shared work pattern", exact: true }).click();
  await saveSettled(page);
  assert((await page.getByLabel("Friday attendance", { exact: true }).inputValue()) === "onsite");
  assert((await page.getByLabel("Saturday attendance", { exact: true }).inputValue()) === "off");
  await page.getByText("Common workday times", { exact: true }).click();
}

async function customPattern(page: Page): Promise<void> {
  await page.getByLabel("Work-pattern editor", { exact: true }).selectOption("true");
  await page.getByText("Repeating work roster (5)", { exact: true }).click();
  assert(
    (await editorSection(page, "Repeating work roster (5)")
      .locator("label")
      .last()
      .textContent()) === "Repeating roster is complete?",
  );
  const first = editorSection(page, "Repeating work roster (5)").locator("fieldset").first();
  await first.getByLabel("Attendance", { exact: true }).selectOption("remote");
  await saveSettled(page);
  const journeys = first.getByLabel("Home–work–home trips", { exact: true });
  assert((await journeys.inputValue()) === "0");
  await journeys.fill("2");
  await journeys.press("Tab");
  await page.getByRole("alert").filter({ hasText: "zero home–work–home trips" }).waitFor();
  await page.getByRole("button", { name: "Revert field", exact: true }).click();
  await textField(page, "Days in repeating cycle", "14");
  const mode = page.getByLabel("Work-pattern editor", { exact: true });
  assert(await mode.getByRole("option", { name: "Weekly", exact: true }).isDisabled());
  await page.reload();
  await page.getByRole("button", { name: "Work pattern checks", exact: true }).click();
  assert((await page.getByLabel("Days in repeating cycle", { exact: true }).inputValue()) === "14");
  await page.getByText("Repeating work roster (5)", { exact: true }).click();
  assert((await first.getByLabel("Attendance", { exact: true }).inputValue()) === "remote");
  await textField(page, "Roster cycle starts", "");
  assert((await mode.inputValue()) === "true");
}

export { workPatternFlow };
