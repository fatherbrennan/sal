import assert from "node:assert/strict";
import type { Page } from "playwright";
import { readBackup } from "../../src/lib/data/schema.ts";
import { importFixture } from "../measurement/compare-flow.ts";
import { expandComparison, saveSettled, textField } from "../measurement/edit-flow.ts";
import { navigateTo } from "../measurement/navigation.ts";
import { duplicateFormula } from "./formula-duplicate-flow.ts";
import { formulaReferenceFlow } from "./formula-reference-flow.ts";
import { topLeftTooltip } from "./tooltip-flow.ts";

const customRowName = "Salary in thousands";
const savedExpression = "annual_base_cash / 1000";

async function createFormula(page: Page): Promise<void> {
  await page.getByRole("button", { name: "formulas", exact: true }).click();
  await page.getByRole("button", { name: "New formula", exact: true }).click();
  await textField(page, "Formula name", customRowName);
  const metricPicker = page.getByRole("combobox", { name: "Insert metric", exact: true });
  await metricPicker.fill("Base cash pay before tax");
  await page
    .getByRole("option", { name: "Base cash pay before tax annual_base_cash", exact: true })
    .waitFor();
  await metricPicker.fill("annual_base_cash");
  await metricPicker.press("ArrowDown");
  await metricPicker.press("Enter");
  const expression = page.getByLabel("Expression", { exact: true });
  assert((await expression.inputValue()) === "annual_base_cash");
  assert(await expression.evaluate((element) => element === document.activeElement));
  await page
    .getByRole("group", { name: "Formula operators", exact: true })
    .getByRole("button", { name: "/", exact: true })
    .click();
  assert(await expression.evaluate((element) => element === document.activeElement));
  await expression.pressSequentially("1000");
  await expression.press("Tab");
  await saveSettled(page);
  assert(await metricPicker.evaluate((element) => element === document.activeElement));
  await page.getByLabel("Preferred result", { exact: true }).selectOption("higher");
  await saveSettled(page);
  await page.getByLabel("Preview comparison", { exact: true }).selectOption("compare-a");
  assert(
    (await page.getByLabel("Preview earnings scenario", { exact: true }).inputValue()) ===
      "guaranteed",
  );
  const preview = page.getByRole("region", { name: "Formula preview" });
  assert(
    (await preview.getByRole("row", { name: "Remote offer 100", exact: true }).count()) === 1,
    (await preview.textContent()) ?? "Missing preview",
  );
  assert((await preview.getByRole("row", { name: "Office offer 110", exact: true }).count()) === 1);
  await expression.fill("1 +");
  await expression.press("Tab");
  assert((await expression.getAttribute("aria-invalid")) === "true");
  await page.getByLabel("Result format", { exact: true }).selectOption("money");
  await saveSettled(page);
  assert((await expression.inputValue()) === "1 +");
  assert(
    (await page.getByRole("status", { name: "Save status" }).textContent())?.includes("not saved"),
  );
  await revertExpression(page);
  assert((await expression.inputValue()) === savedExpression);
  assert(await expression.evaluate((element) => element === document.activeElement));
}

async function revertExpression(page: Page): Promise<void> {
  const revert = page.getByRole("button", { name: "Revert expression", exact: true });
  assert((await revert.textContent())?.trim() === "↺");
  await topLeftTooltip(revert, "Revert expression to its last saved value");
  await revert.press("Enter");
}

async function selectFormula(page: Page): Promise<void> {
  await page.getByRole("button", { name: "comparisons", exact: true }).click();
  await page.getByLabel("Saved comparison", { exact: true }).selectOption("compare-a");
  await expandComparison(page);
  const picker = page.getByRole("combobox", { name: "Custom formula rows", exact: true });
  await picker.fill(customRowName);
  await page.getByRole("option", { name: customRowName, exact: true }).click();
  await picker.press("Escape");
  await saveSettled(page);
  const row = page.getByRole("rowheader", { name: customRowName, exact: true }).locator("..");
  assert((await row.textContent())?.includes("$100.00"));
  assert((await row.textContent())?.includes("$110.00"));
  assert((await row.textContent())?.includes("+$10.00"));
  await row
    .getByRole("button", {
      name: "Inspect Salary in thousands: $100.00 · Remote offer",
      exact: true,
    })
    .click();
  await page.getByRole("dialog", { name: "Calculation inspector", exact: true }).waitFor();
  assert(
    (
      await page.getByRole("dialog", { name: "Calculation inspector", exact: true }).textContent()
    )?.includes("salary_in_thousands"),
  );
  await page.keyboard.press("Escape");
}

async function comparisonChoices(page: Page): Promise<void> {
  await page.getByRole("button", { name: "New comparison", exact: true }).click();
  await saveSettled(page);
  const offers = page.getByRole("combobox", { name: "Offers to compare", exact: true });
  await offers.fill("Remote offer");
  await page.getByRole("option", { name: "Remote offer", exact: true }).click();
  await offers.press("Escape");
  await saveSettled(page);
  const picker = page.getByRole("combobox", { name: "Custom formula rows", exact: true });
  await picker.fill(customRowName);
  assert(
    (await page
      .getByRole("option", { name: customRowName, exact: true })
      .getAttribute("aria-selected")) === "false",
  );
  await picker.press("Escape");
  await page.getByLabel("Saved comparison", { exact: true }).selectOption("compare-a");
  await page.getByRole("rowheader", { name: customRowName, exact: true }).waitFor();
}

async function formulaRowOrder(page: Page): Promise<void> {
  await page.getByRole("button", { name: "formulas", exact: true }).click();
  await page.getByRole("button", { name: "New formula", exact: true }).click();
  await textField(page, "Formula name", "Pay units");
  await textField(page, "Expression", "[Base cash pay before tax] / 10000");
  await page.getByRole("button", { name: "comparisons", exact: true }).click();
  await expandComparison(page);
  const picker = page.getByRole("combobox", { name: "Custom formula rows", exact: true });
  await picker.fill("Pay units");
  await page.getByRole("option", { name: "Pay units", exact: true }).click();
  await picker.press("Escape");
  await saveSettled(page);
  const row = page.getByRole("rowheader", { name: "Pay units", exact: true }).locator("..");
  assert((await row.textContent())?.includes("+1"));
  assert((await row.locator(".better, .worse").count()) === 0);
  await row.getByRole("button", { name: "Select Pay units row", exact: true }).click();
  await page.getByRole("button", { name: "Move Pay units up", exact: true }).click();
  await saveSettled(page);
  const names = await page.getByRole("rowheader").allTextContents();
  assert(
    names.findIndex((name) => name.includes("Pay units")) <
      names.findIndex((name) => name.includes(customRowName)),
  );
  await page.getByRole("button", { name: "formulas", exact: true }).click();
  await page.getByRole("button", { name: customRowName, exact: true }).click();
  await page.getByRole("button", { name: "comparisons", exact: true }).click();
}

async function formulaConflict(page: Page): Promise<void> {
  const other = await page.context().newPage();
  try {
    await other.goto(page.url());
    await other.getByRole("button", { name: "formulas", exact: true }).click();
    await textField(other, "Expression", `${savedExpression} + 1`);
    await page
      .getByRole("rowheader", { name: customRowName, exact: true })
      .locator("..")
      .filter({ hasText: "$101.00" })
      .waitFor();
    await page.getByRole("button", { name: "formulas", exact: true }).click();
    const expression = page.getByLabel("Expression", { exact: true });
    await expression.fill(`${savedExpression} + 2`);
    await expression.press("Tab");
    const conflict = page.getByRole("region", { name: "Resolve conflicting edits" });
    await conflict.waitFor();
    assert((await conflict.textContent())?.includes("+ 1"));
    assert((await conflict.textContent())?.includes("+ 2"));
    await conflict.getByLabel("Keep stored version", { exact: true }).check();
    await conflict.getByRole("button", { name: "Resolve selected versions", exact: true }).click();
    await saveSettled(page);
    assert((await expression.inputValue()) === `${savedExpression} + 1`);
    await textField(page, "Expression", savedExpression);
    await page.getByRole("button", { name: "comparisons", exact: true }).click();
    await page.getByRole("rowheader", { name: customRowName, exact: true }).waitFor();
  } finally {
    await other.close();
  }
}

async function formulaPersistence(page: Page, reload: boolean): Promise<void> {
  if (reload) {
    await page.reload();
  }
  await page.getByRole("button", { name: "comparisons", exact: true }).click();
  await page.getByLabel("Saved comparison", { exact: true }).selectOption("compare-a");
  await page.getByRole("rowheader", { name: customRowName, exact: true }).waitFor();
  await page.getByRole("button", { name: "formulas", exact: true }).click();
  assert((await page.getByLabel("Expression", { exact: true }).inputValue()) === savedExpression);
  await textField(page, "Expression", `${savedExpression} + 5`);
  await page.getByRole("button", { name: "comparisons", exact: true }).click();
  const row = page.getByRole("rowheader", { name: customRowName, exact: true }).locator("..");
  assert((await row.textContent())?.includes("$105.00"));
  await page.getByRole("button", { name: "formulas", exact: true }).click();
  const archive = page.getByRole("button", { name: "Archive formula", exact: true });
  assert((await archive.textContent())?.trim() === "␧");
  await archive.click();
  await saveSettled(page);
  await topLeftTooltip(
    page.getByRole("button", { name: "Restore formula", exact: true }),
    "Restore this archived formula to the library",
  );
  await page.getByRole("button", { name: "comparisons", exact: true }).click();
  assert((await row.textContent())?.includes("$105.00"));
  await navigateTo(page, "Backups");
  await page.getByRole("button", { name: "Prepare JSON backup", exact: true }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download sal-backup.json", exact: true }).click();
  const downloaded = await download;
  const path = await downloaded.path();
  assert(path);
  const text = await Bun.file(path).text();
  assert(text.includes(customRowName));
  assert(text.includes("formulaId"));
  await restoreBackup(page, text);
}

async function restoreBackup(page: Page, text: string): Promise<void> {
  const restored = await page.context().browser()?.newPage();
  assert(restored);
  try {
    await restored.goto(page.url());
    await importFixture(restored, readBackup(JSON.parse(text)));
    await restored.getByRole("button", { name: "comparisons", exact: true }).click();
    await restored.getByLabel("Saved comparison", { exact: true }).selectOption("compare-a");
    const row = restored.getByRole("rowheader", { name: customRowName, exact: true }).locator("..");
    assert((await row.textContent())?.includes("$105.00"));
  } finally {
    await restored.close();
  }
}

async function formulasFlow(page: Page, artifact: string, reload = true): Promise<void> {
  await importFixture(page);
  await createFormula(page);
  await formulaAppearance(page, artifact, "dark");
  await formulaAppearance(page, artifact, "light");
  await page.evaluate(() => document.documentElement.setAttribute("data-appearance", "system"));
  await duplicateFormula(page);
  await formulaReferenceFlow(page);
  await selectFormula(page);
  await formulaRowOrder(page);
  await comparisonChoices(page);
  await formulaConflict(page);
  await formulaPersistence(page, reload);
  await page.getByRole("button", { name: "formulas", exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  assert(
    await page
      .getByRole("region", { name: "Formula editor", exact: true })
      .evaluate(
        (element) => element.getBoundingClientRect().right <= document.documentElement.clientWidth,
      ),
  );
  await page.screenshot({ path: `${artifact}-narrow.png`, fullPage: true });
}

async function formulaAppearance(page: Page, artifact: string, appearance: string): Promise<void> {
  await page.evaluate(
    (mode) => document.documentElement.setAttribute("data-appearance", mode),
    appearance,
  );
  const expression = page.getByLabel("Expression", { exact: true });
  await expression.focus();
  const styles = await expression.evaluate((element) => {
    const control = getComputedStyle(element);
    const frame = getComputedStyle(element.parentElement ?? element);
    return {
      background: control.backgroundColor,
      border: control.borderWidth,
      color: control.color,
      frameColor: frame.color,
      font: control.fontFamily,
      outline: frame.outlineStyle,
    };
  });
  assert(
    styles.background === "rgba(0, 0, 0, 0)",
    "Expression must use the shared field background",
  );
  assert(styles.border === "0px", "Expression must have a single field border");
  assert(styles.color === styles.frameColor, "Expression must use the theme text color");
  assert(styles.font.includes("IBM Plex Mono"));
  assert(styles.outline !== "none", "Expression focus must stay visible");
  await page.screenshot({ path: `${artifact}-editor-${appearance}.png`, fullPage: true });
}

export { createFormula, formulasFlow };
