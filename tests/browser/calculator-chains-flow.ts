import assert from "node:assert/strict";
import type { Page } from "playwright";
import { saveSettled } from "../measurement/edit-flow.ts";
import { navigateTo } from "../measurement/navigation.ts";

const actions = [
  ["Add clicked value", "a"],
  ["Subtract clicked value", "b"],
  ["Multiply by clicked value", "m"],
  ["Divide by clicked value", "d"],
  ["Undo the last calculator operation", "u"],
  ["Clear calculator history and entry", "c"],
] as const;

async function recordChains(page: Page, artifact: string): Promise<void> {
  await navigateTo(page, "Keyboard shortcuts");
  await actions.reduce(async (previous, [action, last]) => {
    await previous;
    const trigger = page.getByRole("button", { name: `Add shortcut for ${action}`, exact: true });
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: "Add shortcut", exact: true });
    const sequence = dialog.getByRole("checkbox", { name: "Two-step sequence", exact: true });
    assert(await sequence.isVisible(), `${action} must offer a sequence`);
    await sequence.focus();
    await sequence.press("Space");
    const input = dialog.getByRole("textbox");
    assert(await input.evaluate((element) => element === document.activeElement));
    await input.press("Control+k");
    const save = dialog.getByRole("button", { name: "Save shortcut", exact: true });
    assert(await save.isDisabled(), "One step cannot save a two-step shortcut");
    await input.press(`Control+${last}`);
    assert((await input.inputValue()) === `Ctrl+K then Ctrl+${last.toUpperCase()}`);
    await page.setViewportSize({ width: 320, height: 800 });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: `${artifact}-calculator-chain-${last}.png` });
    await page.setViewportSize({ width: 1280, height: 800 });
    await input.press("Enter");
    await dialog.waitFor({ state: "hidden" });
    await saveSettled(page);
    assert(await trigger.evaluate((element) => element === document.activeElement));
  }, Promise.resolve());
  await page.reload();
  await navigateTo(page, "Keyboard shortcuts");
  await Promise.all(
    actions.map(async ([action, last]) => {
      const row = page.getByRole("row").filter({
        has: page.getByRole("button", {
          name: `Edit ${action}: Ctrl+K Ctrl+${last.toUpperCase()}`,
          exact: true,
        }),
      });
      assert(
        (await row.locator("kbd").allTextContents())
          .join(" ")
          .startsWith(`Ctrl K Ctrl ${last.toUpperCase()}`),
      );
      assert((await row.getByText("then", { exact: true }).count()) === 1);
    }),
  );
}

async function pressChain(page: Page, last: string): Promise<void> {
  await page.keyboard.press("Control+k");
  await page.keyboard.press(`Control+${last}`);
}

async function calculatorChainsFlow(page: Page, artifact: string): Promise<void> {
  await recordChains(page, artifact);
  await navigateTo(page, "Preferences");
  const calculator = page.getByRole("complementary", { name: "Quick calculator" });
  const toggle = calculator.getByRole("button", { name: "Calculator", exact: true });
  if ((await toggle.getAttribute("aria-expanded")) === "false") {
    await toggle.click();
  }
  await calculator.getByRole("button", { name: "Clear", exact: true }).click();
  await page.evaluate(() => {
    const sample = document.createElement("p");
    sample.id = "calculator-chain-value";
    sample.textContent = "2";
    document.body.prepend(sample);
  });
  const sample = page.locator("#calculator-chain-value");
  try {
    await exerciseChains(page);
    await cancelChains(page);
    await pressChain(page, "s");
    await page.getByRole("heading", { name: "Keyboard shortcuts", exact: true }).waitFor();
    await page.getByRole("button", { name: "Reset all shortcuts", exact: true }).click();
    await saveSettled(page);
  } finally {
    await page.keyboard.up("Control");
    await sample.evaluate((element) => element.remove());
  }
}

async function exerciseChains(page: Page): Promise<void> {
  const calculator = page.getByRole("complementary", { name: "Quick calculator" });
  const apply = calculator.getByRole("button", { name: "Apply", exact: true });
  const sample = page.locator("#calculator-chain-value");
  const total = page.getByLabel("Calculator total", { exact: true });
  const clickChain = async (last: string) => {
    await apply.focus();
    await page.keyboard.press("Control+k");
    await page.keyboard.down("Control");
    await page.keyboard.down(last);
    await sample.click();
    await page.keyboard.up(last);
    await page.keyboard.up("Control");
  };
  await [
    ["a", "2"],
    ["b", "0"],
    ["a", "2"],
    ["m", "4"],
    ["d", "2"],
  ].reduce(async (previous, [last, expected]) => {
    await previous;
    assert(last && expected);
    await clickChain(last);
    assert((await total.textContent())?.trim() === expected);
  }, Promise.resolve());
  await pressChain(page, "u");
  assert((await total.textContent())?.trim() === "4");
  await pressChain(page, "c");
  assert((await total.textContent())?.trim() === "0");
  await clickChain("a");
  await sample.click();
  assert((await total.textContent())?.trim() === "2");
}

async function cancelChains(page: Page): Promise<void> {
  const calculator = page.getByRole("complementary", { name: "Quick calculator" });
  const apply = calculator.getByRole("button", { name: "Apply", exact: true });
  const sample = page.locator("#calculator-chain-value");
  const total = page.getByLabel("Calculator total", { exact: true });
  await apply.focus();
  await page.keyboard.press("Control+k");
  await page.keyboard.press("q");
  await page.keyboard.press("Control+u");
  assert((await total.textContent())?.trim() === "2");
  await page.keyboard.press("Control+k");
  await sample.click();
  await page.keyboard.press("Control+u");
  assert((await total.textContent())?.trim() === "2");
  const input = calculator.getByRole("textbox", { name: "Calculator number" });
  await input.fill("10");
  await pressChain(page, "u");
  assert((await total.textContent())?.trim() === "2");
  await apply.focus();
  await page.keyboard.press("Delete");
  await page.keyboard.press("Delete");
  assert((await total.textContent())?.trim() === "0");
  await input.fill("2");
  await apply.click();
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  assert((await total.textContent())?.trim() === "0");
}

export { calculatorChainsFlow };
