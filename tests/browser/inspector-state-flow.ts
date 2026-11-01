import assert from "node:assert/strict";
import type { Page } from "playwright";
import { amountButton, closeInspector } from "../measurement/inspector-flow.ts";
import { uiStateData } from "./ui-state-storage.ts";

async function inspectorStateFlow(page: Page): Promise<void> {
  const panel = page.getByRole("dialog", { name: "Calculation inspector" });
  const headline = "Package value after tax, commute costs and commute time value";
  await amountButton(page, headline, 1).click();
  const original = await panel.locator("[data-node-heading]").textContent();
  await uiStateData(page);
  await page.reload();
  await panel.waitFor();
  assert((await panel.locator("[data-node-heading]").textContent()) === original);
  assert((await panel.locator(".context").textContent())?.includes("Office offer"));
  await closeInspector(page);
  await uiStateData(page);
  await page.reload();
  await page.getByLabel("Saved comparison", { exact: true }).waitFor();
  assert(!(await panel.isVisible()), "A closed inspector must stay closed after reload");

  await page.getByRole("button", { name: "Annual leave details", exact: true }).click();
  await amountButton(page, "Base pay before tax per leave hour", 1).click();
  const leave = await panel.locator("[data-node-heading]").textContent();
  await uiStateData(page);
  await page.reload();
  await panel.waitFor();
  assert((await panel.locator("[data-node-heading]").textContent()) === leave);
  await panel.getByRole("button", { name: "Show in comparison", exact: true }).click();
  await panel.waitFor({ state: "hidden" });
  await uiStateData(page);
  await page.reload();
  await page.getByLabel("Saved comparison", { exact: true }).waitFor();
  assert(!(await panel.isVisible()), "Showing the comparison must keep the drawer hidden");

  await amountButton(page, headline).click();
  await panel.getByRole("heading", { name: "Calculation inspector", exact: true }).press("Escape");
  await panel.waitFor({ state: "hidden" });
  await uiStateData(page);
  await page.reload();
  await page.getByLabel("Saved comparison", { exact: true }).waitFor();
  assert(!(await panel.isVisible()), "Escape must save the closed state");
}

export { inspectorStateFlow };
