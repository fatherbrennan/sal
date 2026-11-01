import assert from "node:assert/strict";
import type { Locator, Page } from "playwright";
import { importFixture } from "../measurement/compare-flow.ts";
import { amountButton, closeInspector } from "../measurement/inspector-flow.ts";
import { calculatorEnhancementsFlow } from "./calculator-enhancements-flow.ts";

async function totalIs(page: Page, expected: string): Promise<void> {
  await page.waitForFunction(
    (text) =>
      document.querySelector("[aria-label='Calculator total']")?.textContent?.trim() === text,
    expected,
  );
}
async function useValue(page: Page, key: string, target: Locator): Promise<void> {
  await page.keyboard.down(key);
  await target.click();
  await page.keyboard.up(key);
}
async function doubleKey(page: Page, key: string): Promise<void> {
  await page.keyboard.press(key);
  await page.keyboard.press(key);
}
async function calculatorFlow(page: Page, artifact: string): Promise<void> {
  await importFixture(page);
  await page.getByRole("button", { name: "offers", exact: true }).click();
  await page.getByRole("button", { name: "Office offer", exact: true }).click();
  const salary = page.getByRole("textbox", { name: "Base salary or revenue (AUD)", exact: true });
  assert((await salary.inputValue()) === "123200");
  await useValue(page, "NumpadAdd", salary);
  await totalIs(page, "123,200");
  const history = page.getByLabel("Calculator history", { exact: true });
  assert((await history.textContent())?.includes("offer-b::amount"));
  assert((await salary.inputValue()) === "123200");
  await useValue(page, "NumpadSubtract", salary);
  await totalIs(page, "0");
  await doubleKey(page, "Delete");
  await totalIs(page, "123,200");
  await page.keyboard.press("Delete");
  await totalIs(page, "123,200");
  await page.keyboard.press("a");
  await page.keyboard.press("Delete");
  await totalIs(page, "123,200");
  await page.keyboard.press("Escape");
  await totalIs(page, "123,200");
  await page.keyboard.press("Escape");
  await totalIs(page, "0");
  await salary.focus();
  await page.keyboard.press("End");
  await page.keyboard.press("-");
  assert((await salary.inputValue()) === "123200-");
  await salary.fill("123200");
  await page.keyboard.press("Tab");
  await page.getByRole("button", { name: "comparisons", exact: true }).click();
  await page.getByLabel("Saved comparison", { exact: true }).selectOption({ label: "Two offers" });
  await page.getByRole("heading", { name: "Two offers", exact: true }).click();
  const cash = amountButton(page, "Cash after tax");
  await useValue(page, "+", cash);
  await totalIs(page, "77,480");
  assert((await page.getByRole("dialog").count()) === 0);
  await cash.click();
  await page.getByRole("dialog").waitFor();
  await useValue(page, "+", page.getByRole("dialog").locator("article > .amount"));
  await totalIs(page, "154,960");
  await page.screenshot({ path: `${artifact}-inspector.png` });
  await closeInspector(page);
  await doubleKey(page, "Escape");
  await totalIs(page, "0");
  await manualAndKeys(page);
  await inlineValues(page);
  await calculatorEnhancementsFlow(page, artifact);
  await calculatorScreenshots(page, artifact);
}

async function calculatorScreenshots(page: Page, artifact: string): Promise<void> {
  const panel = page.getByRole("complementary", { name: "Quick calculator" });
  const bounds = await panel.boundingBox();
  assert(bounds && bounds.x >= 0 && bounds.y >= 0);
  const viewportWidth = await page.evaluate(() => document.documentElement.clientWidth);
  assert(Math.abs(bounds.x + bounds.width / 2 - viewportWidth / 2) < 1);
  assert(bounds.y + bounds.height <= (page.viewportSize()?.height ?? 0));
  await page.screenshot({ path: `${artifact}.png` });
  await page.evaluate(() => document.documentElement.setAttribute("data-appearance", "dark"));
  await page.screenshot({ path: `${artifact}-dark.png` });
}

async function manualAndKeys(page: Page): Promise<void> {
  const panel = page.getByRole("complementary", { name: "Quick calculator" });
  await panel.getByRole("button", { name: "Calculator", exact: true }).click();
  const input = panel.getByRole("textbox", { name: "Calculator number" });
  const apply = panel.getByRole("button", { name: "Apply", exact: true });
  await input.fill("20");
  await input.press("Enter");
  await totalIs(page, "20");
  await panel.getByRole("combobox").selectOption("*");
  await input.fill("0");
  await apply.click();
  await totalIs(page, "0");
  await doubleKey(page, "Delete");
  await totalIs(page, "20");
  await panel.getByRole("combobox").selectOption("/");
  await apply.click();
  await panel.getByRole("alert").getByText("Cannot divide by zero. Total unchanged.").waitFor();
  await totalIs(page, "20");
  await input.fill("4");
  await apply.click();
  await totalIs(page, "5");
  await input.fill("invalid");
  await apply.click();
  await panel.getByRole("alert").getByText("Enter a valid number.").waitFor();
  await totalIs(page, "5");
  await panel.getByRole("button", { name: "Undo last" }).focus();
  await page.keyboard.press("Enter");
  await totalIs(page, "20");
  await page.keyboard.down("Delete");
  await page.keyboard.down("Delete");
  await page.keyboard.up("Delete");
  await totalIs(page, "20");
  await page.keyboard.press("a");
  await doubleKey(page, "Escape");
  await totalIs(page, "0");
  assert((await panel.getByRole("list").textContent())?.trim() === "No calculations yet.");
}

async function inlineValues(page: Page): Promise<void> {
  await page.evaluate(() => {
    const sample = document.createElement("p");
    sample.id = "calculator-sample";
    sample.textContent = "Values: $1,200.50 and −2.5 and 12%";
    sample.style.cssText =
      "position:fixed;top:200px;right:20px;background:var(--panel);z-index:101";
    document.body.append(sample);
  });
  await [
    { token: "$1,200.50", key: "+", expected: "1,200.5" },
    { token: "−2.5", key: "*", expected: "-3,001.25" },
    { token: "12%", key: "/", expected: "≈ -250.104166666667" },
  ].reduce(async (previous, { token, key, expected }) => {
    await previous;
    const point = await page.locator("#calculator-sample").evaluate((element, text) => {
      const node = element.firstChild;
      assertNode(node);
      const index = (node.textContent ?? "").indexOf(text);
      const range = document.createRange();
      range.setStart(node, index);
      range.setEnd(node, index + text.length);
      const rect = range.getBoundingClientRect();
      return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
      function assertNode(value: Node | null): asserts value is Node {
        if (value === null) {
          throw new Error("Missing sample");
        }
      }
    }, token);
    await page.keyboard.down(key);
    await page.mouse.click(point.x, point.y);
    await page.keyboard.up(key);
    await totalIs(page, expected);
  }, Promise.resolve());
  await page.locator("#calculator-sample").evaluate((element) => {
    element.textContent = "100";
  });
  await page.keyboard.down("+");
  await page.evaluate(() => globalThis.dispatchEvent(new Event("blur")));
  await page.locator("#calculator-sample").click();
  await page.keyboard.up("+");
  await totalIs(page, "≈ -250.104166666667");
  await page.locator("#calculator-sample").evaluate((element) => element.remove());
}

export { calculatorFlow };
