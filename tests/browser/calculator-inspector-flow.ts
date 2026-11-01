import assert from "node:assert/strict";
import type { Page } from "playwright";
import { amountButton, closeInspector } from "../measurement/inspector-flow.ts";

async function calculatorInspectorFlow(page: Page): Promise<void> {
  await page.setViewportSize({ width: 600, height: 800 });
  const calculator = page.getByRole("complementary", { name: "Quick calculator" });
  await calculator.getByRole("button", { name: "Clear", exact: true }).click();
  await calculator.getByRole("button", { name: "Calculator", exact: true }).click();
  const amount = amountButton(page, "Cash after tax");
  await amount.click();
  const inspector = page.getByRole("dialog", { name: "Calculation inspector" });
  assert(await inspector.evaluate((element) => element.matches(":modal")));
  assert((await inspector.getByRole("button", { name: "Pin beside comparison" }).count()) === 0);
  await page.keyboard.down("+");
  await inspector.getByRole("button", { name: "Show in comparison", exact: true }).click();
  await inspector.waitFor({ state: "hidden" });
  await amount.click();
  await page.keyboard.up("+");
  assert(!(await inspector.isVisible()), "Holding + must survive the return from the inspector");
  assert((await calculator.getByLabel("Calculator total").textContent())?.trim() === "77,480");
  await [
    { key: "+", expected: "154,960" },
    { key: "-", expected: "77,480" },
    { key: "/", expected: "1" },
    { key: "*", expected: "77,480" },
  ].reduce(async (previous, { key, expected }) => {
    await previous;
    await page.getByLabel("Saved comparison", { exact: true }).focus();
    await page.keyboard.down(key);
    await amount.click();
    await page.keyboard.up(key);
    assert(!(await inspector.isVisible()), "Calculator clicks must not reopen the modal inspector");
    assert(
      await page
        .getByLabel("Saved comparison", { exact: true })
        .evaluate((element) => element === document.activeElement),
    );
    assert((await calculator.getByLabel("Calculator total").textContent())?.trim() === expected);
  }, Promise.resolve());
  await amount.click();
  await inspector.waitFor();
  await closeInspector(page);
  await calculator.getByRole("button", { name: "Calculator", exact: true }).click();
  await page.setViewportSize({ width: 1280, height: 800 });
}

export { calculatorInspectorFlow };
