import assert from "node:assert/strict";
import type { Locator, Page } from "playwright";

async function dispatchKey(
  target: Locator,
  key: string,
  options: Pick<
    KeyboardEventInit,
    "repeat" | "isComposing" | "modifierAltGraph" | "ctrlKey" | "metaKey" | "altKey" | "shiftKey"
  > = {},
): Promise<boolean> {
  return await target.evaluate(
    (element, data) => {
      const event = new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        key: data.key,
        ...data.options,
      });
      element.dispatchEvent(event);
      return event.defaultPrevented;
    },
    { key, options },
  );
}

async function calculatorAudit(page: Page): Promise<void> {
  const panel = page.getByRole("complementary", { name: "Quick calculator" });
  const toggle = panel.getByRole("button", { name: "Calculator", exact: true });
  if ((await toggle.getAttribute("aria-expanded")) === "false") {
    await toggle.click();
  }
  await panel.getByRole("button", { name: "Clear", exact: true }).click();
  const input = panel.getByRole("textbox", { name: "Calculator number" });
  const apply = panel.getByRole("button", { name: "Apply", exact: true });
  await apply.focus();
  assert(!(await dispatchKey(apply, "Delete")), "Empty history has nothing to undo");
  assert(!(await dispatchKey(apply, "Escape")), "Empty calculator has nothing to clear");
  await input.fill("7");
  await apply.focus();
  assert(!(await dispatchKey(apply, "Delete")), "An entry alone cannot be undone");
  await apply.press("Escape");
  await apply.press("Escape");
  assert((await input.inputValue()) === "", "An unapplied entry can be cleared");
  await input.fill("bad");
  await input.press("Enter");
  await panel.getByRole("alert").waitFor();
  await input.fill("");
  await apply.focus();
  await apply.press("Escape");
  await apply.press("Escape");
  assert((await panel.getByRole("alert").count()) === 0, "An error alone can be cleared");
  await input.fill("10");
  await apply.press("Enter");
  await excludedInputs(page);
  await heldConditions(page);
}

async function excludedInputs(page: Page): Promise<void> {
  await page.evaluate(() => {
    const fixture = document.createElement("section");
    fixture.id = "shortcut-input-audit";
    fixture.setAttribute("aria-label", "Shortcut input audit");
    for (const type of ["text", "checkbox", "radio"]) {
      const input = document.createElement("input");
      input.type = type;
      input.setAttribute("aria-label", `Audit ${type}`);
      fixture.append(input);
    }
    const select = document.createElement("select");
    select.setAttribute("aria-label", "Audit select");
    select.append(new Option("Choice", "choice"));
    const editable = document.createElement("div");
    editable.contentEditable = "true";
    editable.setAttribute("aria-label", "Audit editable");
    editable.textContent = "12";
    fixture.append(select, editable);
    document.body.append(fixture);
  });
  const total = page.getByLabel("Calculator total", { exact: true });
  try {
    const consumed = await page.locator("#shortcut-input-audit").evaluate((fixture) => {
      const results: boolean[] = [];
      for (const control of fixture.querySelectorAll<HTMLElement>(
        "input, select, [contenteditable]",
      )) {
        control.focus();
        for (const key of ["Escape", "Escape", "Delete", "Delete"]) {
          const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });
          control.dispatchEvent(event);
          results.push(event.defaultPrevented);
        }
      }
      return results;
    });
    assert(
      consumed.every((value) => !value),
      "Every input retains its own keys",
    );
    assert((await total.textContent())?.trim() === "10");
  } finally {
    await page.locator("#shortcut-input-audit").evaluate((element) => element.remove());
  }
}

async function heldConditions(page: Page): Promise<void> {
  const panel = page.getByRole("complementary", { name: "Quick calculator" });
  const apply = panel.getByRole("button", { name: "Apply", exact: true });
  await page.evaluate(() => {
    const sample = document.createElement("p");
    sample.id = "shortcut-value-audit";
    sample.textContent = "2";
    document.body.append(sample);
  });
  const sample = page.locator("#shortcut-value-audit");
  const total = page.getByLabel("Calculator total", { exact: true });
  try {
    const ignored = async (options: KeyboardEventInit) => {
      await apply.focus();
      assert(!(await dispatchKey(apply, "+", options)));
      await sample.click();
      assert((await total.textContent())?.trim() === "10");
    };
    await ignored({ repeat: true });
    await ignored({ isComposing: true });
    await ignored({ modifierAltGraph: true });
    await apply.focus();
    await page.keyboard.down("+");
    await sample.click({ button: "right" });
    assert((await total.textContent())?.trim() === "10", "Secondary clicks do not calculate");
    await page.keyboard.down("Control");
    await sample.click();
    assert((await total.textContent())?.trim() === "10", "Click modifiers must still match");
    await page.keyboard.up("Control");
    await sample.click();
    assert((await total.textContent())?.trim() === "12");
    await page.keyboard.up("+");
    await sample.click();
    assert((await total.textContent())?.trim() === "12", "Released bindings do not calculate");
    await apply.focus();
    await page.keyboard.down("+");
    await total.click();
    assert((await total.textContent())?.trim() === "12", "Calculator values are excluded");
    await page.keyboard.up("+");
    const toggle = panel.getByRole("button", { name: "Calculator", exact: true });
    assert(
      (await toggle.getAttribute("aria-expanded")) === "false",
      "Excluded clicks retain their normal action",
    );
    await toggle.click();
  } finally {
    await page.keyboard.up("+");
    await page.keyboard.up("Control");
    await sample.evaluate((element) => element.remove());
  }
}

export { calculatorAudit, dispatchKey };
