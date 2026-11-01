import assert from "node:assert/strict";
import type { Page } from "playwright";
import { expandComparison, saveSettled, textField } from "./edit-flow.ts";
import { selectScenario } from "./navigation.ts";

const relativeChange = /relative change/u;
const whitespace = /\s+/gu;
const columnCount = 3;

async function deltaText(page: Page, label: string, expected: string): Promise<void> {
  const row = page.getByRole("row").filter({
    has: page.getByRole("rowheader", { name: label, exact: true }),
  });
  const trigger = row.getByRole("button", { name: relativeChange });
  assert((await trigger.textContent())?.replace(whitespace, " ").trim() === expected, expected);
}

async function deltaAlignment(page: Page): Promise<void> {
  const columns = await page.locator(".delta-values:visible").evaluateAll((differences) =>
    differences.map((difference) =>
      [...difference.children].map((span) => {
        const box = span.getBoundingClientRect();
        const text = document.createRange();
        text.selectNodeContents(span);
        return {
          left: box.left,
          right: box.right,
          top: box.top,
          text: text.getBoundingClientRect().width,
        };
      }),
    ),
  );
  const [first] = columns;
  assert(first !== undefined && first.length === columnCount);
  const percentageBelow = (first[1]?.top ?? 0) > (first[0]?.top ?? 0) + 1;
  assert(columns.length > 10);
  for (const row of columns) {
    assert(row.length === columnCount);
    for (const [index, column] of row.entries()) {
      const reference: number | undefined = first[index]?.right;
      assert(reference !== undefined);
      assert(Math.abs(column.right - reference) < 1, "Difference columns align across rows");
      assert(column.text <= column.right - column.left + 1, "Difference text fits its column");
      const offset = column.top - (row[0]?.top ?? 0);
      const onSecondLine = index === 1 && percentageBelow;
      assert(
        (onSecondLine && offset > 1) || (!onSecondLine && Math.abs(offset) < 1),
        "Amounts and direction align; stacked percentages stay below them",
      );
    }
  }
}

async function deltaColor(page: Page, label: string, token: string): Promise<void> {
  const row = page.getByRole("row").filter({
    has: page.getByRole("rowheader", { name: label, exact: true }),
  });
  const delta = row
    .locator("td small")
    .filter({ has: page.locator(".delta-values, .equation-trigger") });
  assert((await delta.count()) === 1, `${label}: only the alternative has a difference`);
  const colors = await delta.evaluate((element, name) => {
    if (!getComputedStyle(element).getPropertyValue(`--${name}`).trim()) {
      throw new Error(`Missing theme color: ${name}`);
    }
    const probe = document.createElement("span");
    probe.style.color = `var(--${name})`;
    element.append(probe);
    const result = {
      actual: getComputedStyle(element).color,
      expected: getComputedStyle(probe).color,
    };
    probe.remove();
    return result;
  }, token);
  assert(colors.actual === colors.expected, `${label}: expected ${token}, got ${colors.actual}`);
}

async function appearanceMode(page: Page, mode: string): Promise<void> {
  await page.evaluate(
    (next) => document.documentElement.setAttribute("data-appearance", next),
    mode,
  );
  assert(
    (await page.locator("html").evaluate((element) => getComputedStyle(element).colorScheme)) ===
      mode,
  );
}

async function comparisonPalette(page: Page, mode: string): Promise<void> {
  await page.getByLabel("Baseline offer", { exact: true }).selectOption("offer-a");
  await saveSettled(page);
  await appearanceMode(page, mode);
  await deltaText(page, "Package value before tax", "+$11,200.00 10% ▲");
  await deltaText(page, "Standard paid hours per year", "No change");
  await deltaText(page, "Personal perk value", "No change");
  await deltaText(page, "Return commute trips per year", "+53 — (base 0) ▲");
  await deltaText(page, "Remote share of work hours (%)", "-100 pp -100% ▼");
  await deltaAlignment(page);
  await deltaColor(page, "Package value before tax", "success");
  await deltaColor(page, "Cash after tax", "success");
  await deltaColor(page, "Employer / hirer super contributions", "success");
  await deltaColor(page, "Tax and HELP repayments attributed to offer", "danger");
  await deltaColor(page, "Ordinary super contribution tax", "danger");
  await deltaColor(
    page,
    "Tax and HELP repayments attributed to offer per standard paid hour",
    "danger",
  );
  await deltaColor(page, "Ordinary super contribution tax per standard paid hour", "danger");
  await deltaColor(page, "Commute costs", "danger");
  await deltaColor(page, "Commute hours per year", "danger");
  await deltaColor(page, "Commute distance per year (km)", "danger");
  await deltaColor(page, "Return commute trips per year", "danger");
  await deltaColor(page, "On-site workdays per year", "danger");
  await deltaColor(page, "Commute time value at package rate before tax", "danger");
  await deltaColor(page, "Commute time value", "danger");
  await deltaColor(page, "Personal perk value", "muted");
  await deltaColor(page, "Standard paid hours per year", "muted");
  await page.getByLabel("Baseline offer", { exact: true }).selectOption("offer-b");
  await saveSettled(page);
  await appearanceMode(page, mode);
  await deltaText(page, "Package value before tax", "-$11,200.00 -9.09% ▼");
  await deltaAlignment(page);
  await deltaColor(page, "Package value before tax", "danger");
  await deltaColor(page, "Cash after tax", "danger");
  await deltaColor(page, "Tax and HELP repayments attributed to offer", "success");
  await deltaColor(page, "Commute costs", "success");
  await deltaColor(page, "Commute hours per year", "success");
  await deltaColor(page, "Commute time value at package rate before tax", "success");
  await deltaColor(page, "Personal perk value", "muted");
  await page.getByRole("region", { name: "Salary comparison" }).screenshot({
    path: `test-results/comparison-colors-${mode}-${page.viewportSize()?.width}.png`,
  });
}

async function systemPalette(page: Page, colorScheme: "light" | "dark"): Promise<void> {
  await page.emulateMedia({ colorScheme });
  assert(
    (await page.locator("html").evaluate((element) => getComputedStyle(element).colorScheme)) ===
      colorScheme,
  );
  await deltaColor(page, "Package value before tax", "danger");
  await deltaColor(page, "Commute costs", "success");
}

async function comparisonColors(page: Page): Promise<void> {
  const appearance = await page.locator("html").getAttribute("data-appearance");
  await comparisonPalette(page, "light");
  await comparisonPalette(page, "dark");
  await page.evaluate(() => document.documentElement.setAttribute("data-appearance", "system"));
  await systemPalette(page, "light");
  await systemPalette(page, "dark");
  await page.emulateMedia({ colorScheme: null });
  await selectScenario(page, "Guaranteed · including one-offs");
  await deltaColor(page, "Other job costs after reimbursements", "danger");
  await page.getByLabel("Baseline offer", { exact: true }).selectOption("offer-a");
  await saveSettled(page);
  await deltaColor(page, "Other job costs after reimbursements", "success");
  await selectScenario(page, "Guaranteed · recurring");
  await page.getByLabel("Baseline offer", { exact: true }).selectOption("");
  await saveSettled(page);
  assert(
    (await page
      .getByRole("region", { name: "Salary comparison" })
      .getByRole("button", { name: relativeChange })
      .count()) === 0,
  );
  await page.getByLabel("Baseline offer", { exact: true }).selectOption("offer-a");
  await saveSettled(page);
  await page.evaluate((previous) => {
    if (previous === null) {
      document.documentElement.removeAttribute("data-appearance");
    } else {
      document.documentElement.setAttribute("data-appearance", previous);
    }
  }, appearance);
}

async function unavailableDifference(page: Page): Promise<void> {
  await textField(page, "Base salary or revenue (AUD)", "");
  await page.getByRole("button", { name: "comparisons", exact: true }).click();
  await page.getByLabel("Saved comparison", { exact: true }).selectOption({ label: "Two offers" });
  await expandComparison(page);
  await deltaColor(page, "Package value before tax", "muted");
  const row = page.getByRole("row").filter({
    has: page.getByRole("rowheader", {
      name: "Package value before tax",
      exact: true,
    }),
  });
  assert((await row.locator("td small").textContent())?.includes("Difference unavailable"));
  await page.getByRole("button", { name: "offers", exact: true }).click();
  await page.getByRole("button", { name: "Remote offer", exact: true }).click();
}

export { comparisonColors, deltaColor, unavailableDifference };
