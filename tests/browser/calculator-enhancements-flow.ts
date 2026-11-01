import assert from "node:assert/strict";
import type { Page } from "playwright";
import { expandComparison } from "../measurement/edit-flow.ts";
import { amountButton, closeInspector } from "../measurement/inspector-flow.ts";
import { calculatorInspectorFlow } from "./calculator-inspector-flow.ts";

async function expectTotal(page: Page, text: string): Promise<void> {
  await page.waitForFunction(
    (expected) =>
      document.querySelector("[aria-label='Calculator total']")?.textContent?.trim() === expected,
    text,
  );
}

async function previewAboveCalculator(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const preview = document
      .querySelector(".highlight-layer:popover-open .preview")
      ?.getBoundingClientRect();
    const panel = document.querySelector("aside[data-calculator]")?.getBoundingClientRect();
    return preview && panel && preview.top >= 0 && preview.bottom < panel.top;
  });
}

async function exactDecimals(page: Page): Promise<void> {
  const panel = page.getByRole("complementary", { name: "Quick calculator" });
  await panel.getByRole("button", { name: "Clear", exact: true }).click();
  const input = panel.getByRole("textbox", { name: "Calculator number" });
  const operation = panel.getByRole("combobox");
  await operation.selectOption("+");
  await input.fill("0.1");
  await input.press("Enter");
  await input.fill("0.2");
  await input.press("Enter");
  await expectTotal(page, "0.3");
  await operation.selectOption("-");
  await input.fill("0.3");
  await input.press("Enter");
  await expectTotal(page, "0");
  await operation.selectOption("+");
  await input.fill("1");
  await input.press("Enter");
  await operation.selectOption("/");
  await input.fill("3");
  await input.press("Enter");
  await expectTotal(page, "≈ 0.333333333333333");
  await operation.selectOption("*");
  await input.press("Enter");
  await expectTotal(page, "1");
  await panel.getByRole("button", { name: "Undo last" }).click();
  await expectTotal(page, "≈ 0.333333333333333");
  assert((await panel.getByRole("list").textContent())?.includes("Manual entry"));
  await panel.getByRole("button", { name: "Clear", exact: true }).click();
}

async function labelledHover(page: Page, artifact: string): Promise<void> {
  const cash = amountButton(page, "Cash after tax");
  await cash.hover();
  await page.keyboard.down("+");
  await page.locator(".highlight-layer:popover-open .highlight").first().waitFor();
  const preview = page.locator("[data-calculator] .preview");
  assert((await preview.textContent())?.includes("offer-a::annual_cash_after_tax"));
  await previewAboveCalculator(page);
  const valueBounds = await preview.locator(".numeric").boundingBox();
  const sourceBounds = await preview.locator("code").boundingBox();
  assert(valueBounds && sourceBounds);
  assert(sourceBounds.y >= valueBounds.y + valueBounds.height, "Source sits below the value");
  await preview.getByText("Source", { exact: true }).waitFor();
  await preview.getByText("Click to apply", { exact: true }).waitFor();
  const sizes = await preview.evaluate((element) => {
    const value = element.querySelector(".numeric");
    const source = element.querySelector("code");
    if (!(value && source)) {
      throw new Error("Missing preview value or source");
    }
    return {
      value: Number.parseFloat(getComputedStyle(value).fontSize),
      source: Number.parseFloat(getComputedStyle(source).fontSize),
      fits: source.scrollWidth <= source.clientWidth,
    };
  });
  const minimumTextSize = 13;
  assert(sizes.source >= minimumTextSize && sizes.value > sizes.source && sizes.fits);
  await expectTotal(page, "0");
  await page.screenshot({ path: `${artifact}-selection.png` });
  await page.evaluate(() => document.documentElement.setAttribute("data-appearance", "light"));
  await page.screenshot({ path: `${artifact}-selection-light.png` });
  await page.evaluate(() => document.documentElement.setAttribute("data-appearance", "dark"));
  await page.screenshot({ path: `${artifact}-selection-dark.png` });
  await page.keyboard.down("+");
  await cash.click();
  await page.keyboard.up("+");
  await expectTotal(page, "77,480");
  await page.locator(".highlight-layer:popover-open").waitFor({ state: "hidden" });
  assert((await page.getByRole("dialog").count()) === 0);
  const history = page.getByRole("list", { name: "Calculator history" });
  assert((await history.textContent())?.includes("offer-a::annual_cash_after_tax"));
  await amountButton(page, "Cash after tax", 1).hover();
  await page.keyboard.down("+");
  await preview.waitFor();
  assert((await preview.textContent())?.includes("offer-b::annual_cash_after_tax"));
  await page.keyboard.up("+");
  const toggle = page.locator("aside").getByRole("button", { name: "Calculator", exact: true });
  await toggle.click();
  await cash.hover();
  await page.keyboard.down("+");
  await previewAboveCalculator(page);
  await page.keyboard.up("+");
  await toggle.click();
}

async function explicitValues(page: Page): Promise<void> {
  await page.evaluate(() => {
    const fixture = document.createElement("div");
    fixture.id = "calculator-explicit-fixture";
    fixture.style.cssText =
      "position:fixed;top:200px;right:20px;z-index:101;background:var(--panel)";
    const number = document.createElement("button");
    number.type = "button";
    number.textContent = "Unit price 1.25 · FY 2026";
    number.setAttribute("data-calculator-value", "1.25");
    number.setAttribute("data-calculator-label", "Vehicle: fuel price");
    const unavailable = document.createElement("button");
    unavailable.type = "button";
    unavailable.textContent = "Unavailable · 2 missing facts";
    unavailable.setAttribute("data-calculator-value", "");
    const input = document.createElement("input");
    input.inputMode = "decimal";
    input.setAttribute("aria-label", "Live calculator sample");
    input.setAttribute("data-calculator-value", "1.25");
    input.value = "4.75";
    fixture.append(number, unavailable, input);
    document.body.append(fixture);
  });
  const fixture = page.locator("#calculator-explicit-fixture");
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await page.keyboard.down("+");
  await fixture.getByRole("button", { name: "Unit price 1.25 · FY 2026" }).click();
  await page.keyboard.up("+");
  await expectTotal(page, "1.25");
  assert(
    (await page.getByRole("list", { name: "Calculator history" }).textContent())?.includes(
      "Vehicle: fuel price",
    ),
  );
  await fixture.getByRole("button", { name: "Unavailable · 2 missing facts" }).hover();
  await page.keyboard.down("+");
  await fixture.getByRole("button", { name: "Unavailable · 2 missing facts" }).click();
  await page.keyboard.up("+");
  await expectTotal(page, "1.25");
  await page.keyboard.down("+");
  await fixture.getByRole("textbox").click();
  await page.keyboard.up("+");
  await expectTotal(page, "6");
  await fixture.evaluate((element) => element.remove());
}

async function calculatorEnhancementsFlow(page: Page, artifact: string): Promise<void> {
  await exactDecimals(page);
  await labelledHover(page, artifact);
  await explicitValues(page);
  await modalPreview(page, artifact);
  await decoratedValues(page);
  await calculatorInspectorFlow(page);
}

async function decoratedValues(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await expandComparison(page);
  await page
    .getByRole("button", {
      name: "100 percentage points less · -100% relative change",
      exact: true,
    })
    .click();
  const popup = page.getByRole("dialog");
  const amount = popup.locator("article > .amount");
  assert((await amount.textContent())?.trim() === "-100 percentage points");
  await page.keyboard.down("+");
  await amount.click();
  await page.keyboard.up("+");
  await expectTotal(page, "-100");
  await closeInspector(page);
}

async function modalPreview(page: Page, artifact: string): Promise<void> {
  const viewport = { width: 800, height: 800 };
  await page.setViewportSize(viewport);
  await amountButton(page, "Cash after tax").click();
  const amount = page.getByRole("dialog").locator("article > .amount");
  await amount.hover();
  await page.keyboard.down("+");
  const preview = page.locator(".highlight-layer:popover-open .preview");
  await preview.waitFor();
  assert((await preview.textContent())?.includes("annual_cash_after_tax"));
  await previewAboveCalculator(page);
  const bounds = await preview.boundingBox();
  assert(bounds && bounds.x >= 0 && bounds.y >= 0);
  assert(bounds.x + bounds.width <= viewport.width);
  assert(bounds.y + bounds.height <= viewport.height);
  await page.screenshot({ path: `${artifact}-modal-preview.png` });
  await page.setViewportSize({ width: 800, height: 480 });
  await previewAboveCalculator(page);
  await amount.click();
  await page.keyboard.up("+");
  await expectTotal(page, "77,486");
  await closeInspector(page);
  await page.setViewportSize({ width: 1280, height: 800 });
}

export { calculatorEnhancementsFlow };
