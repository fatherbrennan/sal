import assert from "node:assert/strict";
import type { Page } from "playwright";
import { readBackup } from "../../src/lib/data/schema.ts";
import { bonus } from "../calculations/package-fixture.ts";
import { importFixture } from "./compare-flow.ts";
import { deltaColor } from "./comparison-colors.ts";
import { editorSection, expandComparison, saveSettled, textField } from "./edit-flow.ts";
import { backupFixture } from "./fixtures.ts";
import { amountButton, closeInspector, followValue } from "./inspector-flow.ts";
import { navigateTo, selectScenario } from "./navigation.ts";

const ordinaryHoursLabel = "Paid hours per leave week";
const leaveSection = /^Paid annual leave/u;
const baseHourly = /^Base cash pay before tax per standard paid hour/u;
const grossHourly = /^Cash pay before tax per standard paid hour/u;
const entitlementHours = /^Annual leave earned \(hours\)/u;
const leaveHourly = /^Base pay before tax per leave hour/u;
const entitlementGross = /^Hypothetical leave cash-out: cash before tax/u;
const balanceGross = /^Recorded leave value: base pay \+ loading before tax/u;

async function openComparison(page: Page): Promise<void> {
  await page.getByRole("button", { name: "comparisons", exact: true }).click();
  await page.getByLabel("Saved comparison", { exact: true }).selectOption({ label: "Two offers" });
  await expandComparison(page);
}

async function openLeaveEditor(page: Page): Promise<void> {
  await page.getByRole("button", { name: "offers", exact: true }).click();
  await page.getByRole("button", { name: "Remote offer", exact: true }).click();
  const section = editorSection(page, leaveSection);
  if ((await section.getAttribute("open")) === null) {
    await section.locator("summary").click();
  }
}

async function annualLeaveFlow(page: Page, artifact = "test-results/annual-leave"): Promise<void> {
  const fixture = backupFixture();
  const first = fixture.records.find(({ id }) => id === "offer-a");
  assert(first);
  first.fields = { ...first.fields, amount: "105000", annualLeave: "4" };
  first.items = { ...first.items, earnings: [bonus({ amount: "10000" })] };
  const second = fixture.records.find(({ id }) => id === "offer-b");
  assert(second);
  second.fields = {
    ...second.fields,
    annualLeave: "6",
    leaveOrdinaryHours: "38",
    leaveRateBasis: "salary",
    leaveLoadingBasis: "none",
    leaveBalanceHours: "8",
    leaveBalanceDate: "2026-10-25",
  };
  await importFixture(page, fixture);
  await openComparison(page);
  const table = page.getByRole("region", { name: "Salary comparison", exact: true });
  const cashRow = table
    .getByRole("rowheader", { name: "Cash after tax", exact: true })
    .locator("..");
  assert((await table.getByRole("row", { name: baseHourly }).textContent())?.includes("$45.07"));
  assert((await table.getByRole("row", { name: grossHourly }).textContent())?.includes("$49.36"));
  await selectScenario(page, "Base pay only · recurring");
  assert((await cashRow.textContent())?.includes("$73,230.00"));
  await selectScenario(page, "Guaranteed · recurring");
  const combinedText = await cashRow.textContent();
  // The approved component estimate uses whole-dollar taxable income, not final-assessment precision.
  assert(combinedText?.includes("$79,301.61"), combinedText ?? "Missing annual cash row");
  const leave = page.getByRole("region", { name: "Salary comparison", exact: true });
  assert((await leave.textContent())?.includes("an unanswered setting does not mean none"));
  await openLeaveEditor(page);
  await enterLeaveFacts(page);
  await verifyPercentageLoading(page, artifact);
  await openComparison(page);
  await verifyLeaveValues(page, artifact);
  await verifyLeaveColors(page);
  assert((await cashRow.textContent())?.includes("$79,301.61"));
  await verifyLeaveBackup(page);
}

async function verifyLeaveColors(page: Page): Promise<void> {
  await (
    [
      ["light", "offer-a", "success", "danger"],
      ["light", "offer-b", "danger", "success"],
      ["dark", "offer-a", "success", "danger"],
      ["dark", "offer-b", "danger", "success"],
    ] as const
  ).reduce(async (previous, [colorScheme, baseline, benefit, tax]) => {
    await previous;
    await page.emulateMedia({ colorScheme });
    await page.getByLabel("Baseline offer", { exact: true }).selectOption(baseline);
    await saveSettled(page);
    await deltaColor(page, "Annual leave earned (weeks)", benefit);
    await deltaColor(page, "Base pay before tax per leave hour", benefit);
    await deltaColor(page, "Annual leave value before tax (base pay + super)", benefit);
    await deltaColor(page, "Hypothetical leave cash-out: cash + super after tax", benefit);
    await deltaColor(page, "Hypothetical leave cash-out: ordinary contribution tax", tax);
    await deltaColor(page, "Paid hours per leave week", "muted");
    await deltaColor(page, "Annual leave earned (hours)", "muted");
    await deltaColor(page, "Recorded unused annual leave (hours)", "muted");
    await deltaColor(page, "Recorded leave value: base pay + loading before tax", "muted");
    await deltaColor(page, "Leave loading before tax per leave hour", "muted");
  }, Promise.resolve());
  await page.emulateMedia({ colorScheme: "light" });
  await page.getByLabel("Baseline offer", { exact: true }).selectOption("offer-a");
  await saveSettled(page);
}

async function enterLeaveFacts(page: Page): Promise<void> {
  assert((await page.getByLabel("Leave pay", { exact: true }).inputValue()) === "salary");
  await textField(page, ordinaryHoursLabel, "40");
  const invalid = page.getByLabel(ordinaryHoursLabel, { exact: true });
  await invalid.fill("0");
  await invalid.press("Tab");
  await page.getByRole("alert").filter({ hasText: "above 0" }).waitFor();
  assert(
    (await page.getByRole("status", { name: "Save status" }).textContent())?.includes("not saved"),
  );
  await textField(page, ordinaryHoursLabel, "40");
  await page.getByLabel("Annual leave loading", { exact: true }).selectOption("none");
  await saveSettled(page);
  await textField(page, "Recorded unused annual leave balance (hours)", "0");
  await textField(page, "Leave balance as of", "2026-10-25");
}

async function verifyPercentageLoading(page: Page, artifact: string): Promise<void> {
  await page.getByLabel("Annual leave loading", { exact: true }).selectOption("percent");
  await saveSettled(page);
  await textField(page, "Leave loading (%)", "17.5");
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ path: `${artifact}-editor.png`, fullPage: true });
  await openComparison(page);
  const table = page.getByRole("region", { name: "Salary comparison", exact: true });
  assert(
    (await table.getByRole("row", { name: entitlementGross }).textContent())?.includes("$8,473.56"),
  );
  await openLeaveEditor(page);
  await page.getByLabel("Annual leave loading", { exact: true }).selectOption("none");
  await saveSettled(page);
  assert(!(await page.getByLabel("Leave loading (%)", { exact: true }).isVisible()));
}

async function verifyLeaveValues(page: Page, artifact: string): Promise<void> {
  const leave = page.getByRole("region", { name: "Salary comparison", exact: true });
  const hours = leave.getByRole("row").filter({
    has: page.getByRole("rowheader", { name: "Paid hours per leave week", exact: true }),
  });
  assert((await hours.getByRole("cell").first().textContent())?.includes("40"));
  assert((await leave.getByRole("row", { name: entitlementHours }).textContent())?.includes("160"));
  assert((await leave.getByRole("row", { name: leaveHourly }).textContent())?.includes("$45.07"));
  assert(
    (await leave.getByRole("row", { name: entitlementGross }).textContent())?.includes("$7,211.54"),
  );
  assert((await leave.getByRole("row", { name: balanceGross }).textContent())?.includes("$0.00"));
  const netRow = leave.getByRole("row").filter({
    has: page.getByRole("rowheader", {
      name: "Hypothetical leave cash-out: cash after tax",
      exact: true,
    }),
  });
  assert((await netRow.getByRole("cell").first().textContent())?.includes("$4,903.70"));
  await verifyLeavePackage(page);
  assert((await leave.textContent())?.includes("2026-10-25"));
  await amountButton(page, "Annual leave value: base pay before tax").click();
  const dialog = page.getByRole("dialog");
  assert((await dialog.textContent())?.includes("annual_leave_entitlement_base_cash"));
  await page.screenshot({ path: `${artifact}-equation.png` });
  await closeInspector(page);
  await cashOutEquation(page, artifact);
  await scrollLeave(page);
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ path: `${artifact}.png` });
  await leave.getByRole("button", { name: "Edit leave inputs", exact: true }).first().click();
  await page.getByLabel("Annual leave entitlement (weeks)", { exact: true }).waitFor();
  await page.waitForFunction(() =>
    Boolean(document.activeElement?.closest('[data-input-key="annualLeave"]')),
  );
  assert(
    await page
      .getByLabel("Annual leave entitlement (weeks)", { exact: true })
      .evaluate((element) => element === document.activeElement),
  );
  await openComparison(page);
}

async function cashOutEquation(page: Page, artifact: string): Promise<void> {
  await page.getByRole("button", { name: "Collapse details", exact: true }).click();
  const setup = page.locator(".comparison-setup");
  if ((await setup.getAttribute("open")) !== null) {
    await setup.locator(":scope > summary").click();
  }
  const overviewRows = 14;
  assert((await page.locator(".overview-result:visible").count()) === overviewRows);
  await page.evaluate(() => globalThis.scrollTo(0, 0));
  await page.screenshot({ path: `${artifact}-overview-light.png`, fullPage: true });
  await page.emulateMedia({ colorScheme: "dark" });
  await page.screenshot({ path: `${artifact}-overview-dark.png`, fullPage: true });
  await page.emulateMedia({ colorScheme: "light" });
  await amountButton(page, "Hypothetical leave cash-out: cash after tax").click();
  const dialog = page.getByRole("dialog");
  await dialog.getByText("Context and assumptions", { exact: true }).click();
  assert(
    await dialog
      .getByText("actual cash-out requires eligibility, agreement and retained leave", {
        exact: false,
      })
      .isVisible(),
  );
  await followValue(dialog, "additional_annual_tax_from_leave");
  await followValue(dialog, "after_leave__annual_component_subtotal");
  assert((await dialog.locator("article").textContent())?.includes("annual_component_subtotal"));
  await page.screenshot({ path: `${artifact}-cash-out-equation.png` });
  await closeInspector(page);
  await amountButton(page, "Package value including hypothetical leave cash-out").click();
  await dialog.getByText("Context and assumptions", { exact: true }).click();
  assert(
    await dialog
      .getByText(
        "Earned leave value is already within ordinary remuneration and is not added again",
        { exact: false },
      )
      .isVisible(),
  );
  await followValue(dialog, "real_world__annual_net_package_after_commuting_costs_and_time");
  await closeInspector(page);
  await amountButton(page, "Package value including hypothetical leave cash-out").click();
  await followValue(dialog, "leave_cash_out__leave_cash_out_net_total");
  await followValue(dialog, "leave_cash_out__hypothetical_annual_leave_cash_after_tax");
  await closeInspector(page);
  await expandComparison(page);
}

async function verifyLeavePackage(page: Page): Promise<void> {
  const expected = [
    ["Annual leave earned (weeks)", "4"],
    ["Annual leave value before tax (base pay + super)", "$8,076.92"],
    ["Hypothetical leave cash-out: super after contribution tax", "$735.58"],
    ["Hypothetical leave cash-out: cash + super after tax", "$5,639.28"],
    ["Package value including hypothetical leave cash-out", "$95,414.10"],
  ];
  const table = page.getByRole("region", { name: "Salary comparison", exact: true });
  await expected.reduce(async (previous, [label, amount]) => {
    await previous;
    assert(label !== undefined && amount !== undefined);
    const row = table.getByRole("row").filter({
      has: page.getByRole("rowheader").getByRole("button", { name: label, exact: true }),
    });
    assert((await row.getByRole("cell").first().textContent())?.includes(amount));
  }, Promise.resolve());
}

async function scrollLeave(page: Page): Promise<void> {
  const right = page.getByRole("button", { name: "Scroll comparison right", exact: true });
  if (await right.isEnabled()) {
    await right.focus();
    await right.press("Enter");
    await page.getByRole("button", { name: "Scroll comparison left", exact: true }).click();
  }
}

async function verifyLeaveBackup(page: Page): Promise<void> {
  await navigateTo(page, "Backups");
  await page.getByRole("button", { name: "Prepare JSON backup", exact: true }).click();
  await page.getByRole("link", { name: "Download sal-backup.json" }).waitFor();
  const exported: unknown = await page.evaluate(async () => {
    const link = document.querySelector("a[download]");
    assertLink(link);
    return await (await fetch(link.href)).json();
    function assertLink(element: Element | null): asserts element is HTMLAnchorElement {
      if (!(element instanceof HTMLAnchorElement)) {
        throw new Error("Missing backup link");
      }
    }
  });
  const record = readBackup(exported).records.find(({ id }) => id === "offer-a");
  assert(record?.fields);
  const {
    leaveOrdinaryHours,
    leaveBalanceHours,
    leaveLoadingBasis,
    leaveBalanceDate,
    leaveLoadingPercent,
  } = record.fields;
  assert(leaveOrdinaryHours === "40" && leaveBalanceHours === "0");
  assert(leaveLoadingPercent === "17.5");
  assert(leaveLoadingBasis === "none" && leaveBalanceDate === "2026-10-25");
  const reopened = await page.context().newPage();
  try {
    await reopened.goto(page.url());
    await openLeaveEditor(reopened);
    assert((await reopened.getByLabel(ordinaryHoursLabel, { exact: true }).inputValue()) === "40");
  } finally {
    await reopened.close();
  }
}

export { annualLeaveFlow };
