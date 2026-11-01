import assert from "node:assert/strict";
import type { Locator, Page } from "playwright";
import { importFixture } from "../measurement/compare-flow.ts";
import { saveSettled } from "../measurement/edit-flow.ts";
import { amountButton, closeInspector, followValue } from "../measurement/inspector-flow.ts";
import { selectScenario } from "../measurement/navigation.ts";

async function search(panel: Locator, symbol: string): Promise<void> {
  await panel.getByRole("combobox", { name: "Search values and inputs" }).fill(symbol);
  await panel
    .getByRole("listbox", { name: "Values and inputs" })
    .getByRole("option")
    .filter({
      has: panel.page().getByText(symbol, { exact: true }),
    })
    .first()
    .click();
}

async function visibleReference(target: Locator): Promise<void> {
  await target.waitFor({ state: "visible" });
  assert(
    await target.evaluate((element) => {
      const box = element.getBoundingClientRect();
      const row = element.closest("tr");
      const label = row?.querySelector("th")?.getBoundingClientRect();
      const heading = document.querySelector(".sticky-heading")?.getBoundingClientRect();
      return (
        box.top >= (heading?.bottom ?? 0) &&
        box.bottom <= innerHeight &&
        box.right > (label?.right ?? 0) &&
        box.left < innerWidth
      );
    }),
    "The selected reference must be visible beyond the sticky headings",
  );
}

async function inspectorNavigationFlow(page: Page): Promise<void> {
  await importFixture(page);
  await page.getByRole("button", { name: "comparisons", exact: true }).click();
  await page.getByLabel("Saved comparison", { exact: true }).selectOption({ label: "Two offers" });
  const panel = page.getByRole("dialog", { name: "Calculation inspector" });
  const group = page.getByRole("button", { name: "Annual leave details", exact: true });
  await page.getByRole("button", { name: "Collapse details", exact: true }).click();
  assert((await group.getAttribute("aria-expanded")) === "false");
  await amountButton(page, "Annual leave value before tax (base pay + super)", 1).click();
  const pin = panel.getByRole("button", { name: "Pin beside comparison", exact: true });
  if ((await pin.getAttribute("aria-pressed")) === "false") {
    await pin.click();
    await saveSettled(page);
  }
  await followValue(panel, "ordinary_base_pay_plus_super_per_hour");
  await followValue(panel, "leave_entitlement__ordinary_base_cash_per_hour");
  assert((await group.getAttribute("aria-expanded")) === "true");
  const destination = page.locator("td:has([data-inspected])");
  const amount = destination.locator(".equation-trigger").first();
  assert((await amount.getAttribute("aria-label"))?.includes("Office offer"));
  assert(
    (await destination.locator("..").getByRole("rowheader").textContent())?.includes(
      "Base pay before tax per leave hour",
    ),
  );
  await visibleReference(amount);
  assert(
    await panel
      .locator("[data-node-heading]")
      .evaluate((element) => element === document.activeElement),
  );
  const show = panel.getByRole("button", { name: "Show in comparison", exact: true });
  assert((await show.textContent())?.trim() === "⸪");
  await group.click();
  assert((await group.getAttribute("aria-expanded")) === "false");
  await show.focus();
  await show.press("Enter");
  assert((await group.getAttribute("aria-expanded")) === "true");
  assert(await amount.evaluate((element) => element === document.activeElement));
  assert(
    (await page.getByRole("button", { name: "Return to inspector", exact: true }).count()) === 0,
  );
  await amount.press("Enter");
  assert(
    await panel
      .locator("[data-node-heading]")
      .evaluate((element) => element === document.activeElement),
  );
  const trail = panel.getByRole("navigation", { name: "Exploration trail" });
  const trailBefore = await trail.textContent();
  await narrowNavigation(page, trailBefore);
  await baselineNavigation(page);
}

async function baselineNavigation(page: Page): Promise<void> {
  await page.setViewportSize({ width: 1920, height: 1080 });
  const difference = page.locator(".key-result td").nth(1).locator("small .equation-trigger");
  await difference.click();
  const panel = page.getByRole("dialog", { name: "Calculation inspector" });
  await search(panel, "offer_1__annual_net_package_value");
  const selected = page.locator("td:has([data-inspected]) .equation-trigger").first();
  assert((await selected.getAttribute("aria-label"))?.includes("Remote offer"));
  await panel.getByRole("button", { name: "Back one step", exact: true }).click();
  assert(await difference.evaluate((element) => element.getAttribute("aria-current") === "true"));
  await closeInspector(page);
  await amountButton(page, "Annual leave value before tax (base pay + super)", 1).click();
  await panel.getByRole("button", { name: "Show in comparison", exact: true }).click();
  const setup = page.locator(".comparison-setup");
  await setup.locator("summary").click();
  await selectScenario(page, "Target · recurring");
  assert(
    (await page.getByRole("button", { name: "Return to inspector", exact: true }).count()) === 0,
  );
  await amountButton(page, "Annual leave value before tax (base pay + super)", 1).click();
  assert((await panel.getByRole("navigation").getByRole("button").count()) === 1);
  await closeInspector(page);
  await selectScenario(page, "Guaranteed · recurring");
}

async function narrowNavigation(page: Page, trailBefore: string | null): Promise<void> {
  const panel = page.getByRole("dialog", { name: "Calculation inspector" });
  const show = panel.getByRole("button", { name: "Show in comparison", exact: true });
  const destination = page.locator("td:has([data-inspected])");
  const amount = destination.locator(".equation-trigger").first();
  const trail = panel.getByRole("navigation", { name: "Exploration trail" });
  await page.setViewportSize({ width: 320, height: 800 });
  await page.waitForFunction(() => document.querySelector("dialog.drawer")?.matches(":modal"));
  await show.click();
  await panel.waitFor({ state: "hidden" });
  await visibleReference(amount);
  assert(await amount.evaluate((element) => element === document.activeElement));
  await amount.click();
  await panel.waitFor();
  assert((await trail.textContent()) === trailBefore);
  await search(panel, "leave_entitlement__ordinary_salary_weeks_per_year");
  assert((await panel.getByRole("status").textContent())?.includes("No standalone row"));
  await panel.getByRole("button", { name: "Back one step", exact: true }).click();
  assert((await panel.getByRole("status").count()) === 0);
  await trail.getByRole("button").first().click();
  await search(panel, "leave_entitlement__ordinary_base_cash_per_hour");
  await closeInspector(page);
  const last = amountButton(page, "Base pay before tax per leave hour", 1);
  await visibleReference(last);
  assert(await last.evaluate((element) => element === document.activeElement));
  assert(
    (await page.getByRole("button", { name: "Return to inspector", exact: true }).count()) === 0,
  );
}

async function cellNavigation(page: Page): Promise<void> {
  const cellInset = 4;
  const panel = page.getByRole("dialog", { name: "Calculation inspector" });
  const amount = amountButton(page, "Annual leave value before tax (base pay + super)", 1);
  const cell = amount.locator("xpath=ancestor::td");
  await cell.click({ position: { x: cellInset, y: cellInset } });
  await panel.waitFor();
  assert((await amount.getAttribute("aria-current")) === "true");
  await closeInspector(page);
  const box = await cell.boundingBox();
  assert(box);
  await cell.click({ position: { x: box.width - cellInset, y: box.height - cellInset } });
  await panel.waitFor();
  assert((await amount.getAttribute("aria-current")) === "true");
  await closeInspector(page);
  const difference = cell.locator("small .equation-trigger");
  await difference.click();
  assert((await difference.getAttribute("aria-current")) === "true");
  assert((await amount.getAttribute("aria-current")) !== "true");
  await closeInspector(page);
  await cell.locator("button.unavailable").click();
  assert(!(await panel.isVisible()));
  const review = page.getByRole("region", { name: "Selected result inputs", exact: true });
  assert(
    await review
      .getByRole("heading", {
        name: "Annual leave value before tax (base pay + super) · Office offer",
        exact: true,
      })
      .isVisible(),
  );
  await review.getByRole("button", { name: "Return to result", exact: true }).click();
}

async function cellNavigationFlow(page: Page): Promise<void> {
  await importFixture(page);
  await page.getByRole("button", { name: "comparisons", exact: true }).click();
  await page.getByLabel("Saved comparison", { exact: true }).selectOption({ label: "Two offers" });
  await cellNavigation(page);
  await cellHover(page, "dark");
  await cellHover(page, "light");
  const amount = amountButton(page, "Annual leave value before tax (base pay + super)", 1);
  await amount.click();
  const panel = page.getByRole("dialog", { name: "Calculation inspector" });
  await followValue(panel, "ordinary_base_pay_plus_super_per_hour");
  const trail = panel.getByRole("navigation", { name: "Exploration trail" });
  const before = await trail.textContent();
  await panel.getByRole("button", { name: "Show in comparison", exact: true }).click();
  await page.locator(".equation-trigger[aria-current='true']").click();
  assert((await trail.textContent()) === before, "Return must preserve the inspector trail");
}

async function cellHover(page: Page, colorScheme: "light" | "dark"): Promise<void> {
  await page.emulateMedia({ colorScheme });
  await page.mouse.move(0, 0);
  const cell = amountButton(page, "Annual leave value before tax (base pay + super)", 1).locator(
    "xpath=ancestor::td",
  );
  const before = await cell.evaluate((element) => getComputedStyle(element).backgroundColor);
  await cell.hover({ position: { x: 4, y: 4 } });
  const after = await cell.evaluate((element) => getComputedStyle(element).backgroundColor);
  assert(after !== before, `${colorScheme}: the whole clickable cell needs a hover tint`);
  await page.screenshot({ path: `test-results/cell-hover-${colorScheme}.png` });
}

export { cellNavigationFlow, inspectorNavigationFlow };
