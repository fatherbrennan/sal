import assert from "node:assert/strict";
import type { Page } from "playwright";
import { importFixture } from "../measurement/compare-flow.ts";
import { saveSettled, textField } from "../measurement/edit-flow.ts";
import { createFormula } from "./formulas-flow.ts";

const moveButton = /^Move /u;
const selectButton = /^Select .+ row$/u;

async function formulaLayoutFlow(page: Page): Promise<void> {
  await importFixture(page);
  await createFormula(page);
  await page.getByRole("button", { name: "New formula", exact: true }).click();
  await textField(page, "Formula name", "Double salary");
  await textField(page, "Expression", "salary_in_thousands * 2");
  await page.getByRole("button", { name: "comparisons", exact: true }).click();
  await page.getByLabel("Saved comparison", { exact: true }).selectOption("compare-a");
  const header = page.locator(".group-heading").filter({ hasText: "Custom formulas" });
  const picker = header.getByRole("combobox", { name: "Custom formula rows", exact: true });
  const manage = header.getByRole("button", { name: "Manage formulas", exact: true });
  assert(await manage.isVisible());
  assert(
    (await page
      .locator(".comparison-setup")
      .getByRole("combobox", {
        name: "Custom formula rows",
        exact: true,
      })
      .count()) === 0,
  );
  assert((await header.getByRole("button", { name: moveButton }).count()) === 0);
  await ["Salary in thousands", "Double salary"].reduce(async (previous, name) => {
    await previous;
    await picker.fill(name);
    await picker.press("ArrowDown");
    await picker.press("Enter");
    await picker.press("Escape");
    await saveSettled(page);
  }, Promise.resolve());
  await orderRows(page);
  await removeRows(page);
  assert(await manage.isVisible());
  await manage.click();
  await page.getByRole("button", { name: "Double salary", exact: true }).click();
  assert(
    (await page.getByLabel("Expression", { exact: true }).inputValue()) ===
      "salary_in_thousands * 2",
  );
}

async function orderRows(page: Page): Promise<void> {
  const select = page.getByRole("button", { name: "Select Double salary row", exact: true });
  await select.press("Enter");
  assert((await select.getAttribute("aria-pressed")) === "true");
  const up = page.getByRole("button", { name: "Move Double salary up", exact: true });
  const down = page.getByRole("button", { name: "Move Double salary down", exact: true });
  assert(await down.isDisabled());
  await up.press("Enter");
  await saveSettled(page);
  assert(await up.isDisabled());
  await down.press("Enter");
  await saveSettled(page);
  assert(await down.isDisabled());
  await up.click();
  await saveSettled(page);
  await page.reload();
  await select.waitFor();
  const names = await page.getByRole("rowheader").allTextContents();
  assert(
    names.findIndex((name) => name.includes("Double salary")) <
      names.findIndex((name) => name.includes("Salary in thousands")),
  );
  assert((await up.count()) === 0);
  await select.press("Space");
  await select.press("Space");
  assert((await up.count()) === 0);
  await select.press("Enter");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "test-results/formula-header-narrow.png", fullPage: true });
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.setViewportSize({ width: 1440, height: 1000 });
}

async function removeRows(page: Page): Promise<void> {
  const picker = page.getByRole("combobox", { name: "Custom formula rows", exact: true });
  await ["Double salary", "Salary in thousands"].reduce(async (previous, name) => {
    await previous;
    const select = page.getByRole("button", { name: `Select ${name} row`, exact: true });
    if ((await select.getAttribute("aria-pressed")) !== "true") {
      await select.click();
    }
    await page
      .getByRole("button", { name: `Remove ${name} from comparison`, exact: true })
      .press("Enter");
    await saveSettled(page);
    assert((await page.getByRole("rowheader", { name, exact: true }).count()) === 0);
    assert(
      await page
        .getByRole("button", { name: "Manage formulas", exact: true })
        .evaluate((element) => element === document.activeElement),
    );
  }, Promise.resolve());
  await page.reload();
  await picker.waitFor();
  assert((await page.getByRole("button", { name: selectButton }).count()) === 0);
}

export { formulaLayoutFlow };
