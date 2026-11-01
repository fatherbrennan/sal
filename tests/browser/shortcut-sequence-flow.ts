import assert from "node:assert/strict";
import type { Page } from "playwright";

async function sequenceKeys(
  page: Page,
  first: string,
  second: string,
  interrupt = false,
): Promise<void> {
  await page.evaluate(
    ({ firstKey, secondKey, interrupted }) => {
      const target = document.activeElement ?? document.body;
      function send(key: string, time: number, repeat = false): void {
        const event = new KeyboardEvent("keydown", {
          key,
          ctrlKey: key.length === 1,
          repeat,
          bubbles: true,
          cancelable: true,
        });
        Object.defineProperty(event, "timeStamp", { value: time });
        target.dispatchEvent(event);
        target.dispatchEvent(new KeyboardEvent("keyup", { key, bubbles: true }));
      }
      const start = 1000;
      const repeatAt = 1500;
      const nextAt = 2000;
      send(firstKey, start);
      send(firstKey, repeatAt, true);
      if (interrupted) {
        target.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
      }
      send(secondKey, nextAt);
    },
    { firstKey: first, secondKey: second, interrupted: interrupt },
  );
}

async function shortcutSequenceFlow(page: Page): Promise<void> {
  const calculator = page.getByRole("complementary", { name: "Quick calculator" });
  await calculator.getByRole("button", { name: "Calculator", exact: true }).click();
  const input = calculator.getByRole("textbox", { name: "Calculator number" });
  const apply = calculator.getByRole("button", { name: "Apply", exact: true });
  const total = page.getByLabel("Calculator total", { exact: true });
  await input.fill("10");
  await apply.click();
  await sequenceKeys(page, "Delete", "Delete", true);
  assert((await total.textContent())?.trim() === "10");
  await apply.focus();
  await page.keyboard.press("q");
  await sequenceKeys(page, "Delete", "Delete");
  await page.waitForFunction(
    () => document.querySelector("[aria-label='Calculator total']")?.textContent?.trim() === "0",
  );
  await input.fill("10");
  await apply.click();
  await sequenceKeys(page, "Escape", "Escape", true);
  assert((await total.textContent())?.trim() === "10");
  await page.keyboard.press("q");
  await sequenceKeys(page, "Escape", "Escape");
  await page.waitForFunction(
    () => document.querySelector("[aria-label='Calculator total']")?.textContent?.trim() === "0",
  );
  await sequenceKeys(page, "k", "s", true);
  assert(
    (await page.getByRole("heading", { name: "Keyboard shortcuts", exact: true }).count()) === 0,
  );
  await sequenceKeys(page, "k", "s");
  await page.getByRole("heading", { name: "Keyboard shortcuts", exact: true }).waitFor();
  await calculator.getByRole("button", { name: "Calculator", exact: true }).click();
}

export { shortcutSequenceFlow };
