import assert from "node:assert/strict";
import type { Page } from "playwright";
import { amountButton, closeInspector } from "../measurement/inspector-flow.ts";
import { calculatorChainsFlow } from "./calculator-chains-flow.ts";
import { multipleShortcutsFlow } from "./multiple-shortcuts-flow.ts";

const editActionPattern = /^Edit /u;

async function edit(page: Page, action: string, keys: string, sequence?: string): Promise<void> {
  await page.getByRole("button", { name: `Edit ${action}:`, exact: false }).click();
  const dialog = page.getByRole("dialog", { name: "Change shortcut" });
  if (sequence) {
    await dialog.getByRole("checkbox", { name: "Two-step sequence" }).check();
  }
  const recorder = dialog.getByRole("textbox", { name: "Press your new key combination" });
  await recorder.press(keys);
  if (sequence) {
    await recorder.press(sequence);
  }
  await dialog.getByRole("button", { name: "Save shortcut", exact: true }).click();
  await dialog.waitFor({ state: "hidden" });
  await page.getByRole("status").filter({ hasText: "Shortcuts saved locally." }).waitFor();
}
async function openKeys(page: Page): Promise<void> {
  await page.keyboard.press("Control+k");
  await page.keyboard.press("Control+s");
  await page.getByRole("heading", { name: "Keyboard shortcuts", exact: true }).waitFor();
}
async function addCash(page: Page): Promise<void> {
  await page.keyboard.down("Alt");
  await page.keyboard.down("a");
  await amountButton(page, "Cash after tax").click();
  await page.keyboard.up("a");
  await page.keyboard.up("Alt");
}
async function conflicts(page: Page, artifact: string): Promise<void> {
  await page.getByRole("button", { name: "Edit Add clicked value:", exact: false }).click();
  const dialog = page.getByRole("dialog", { name: "Change shortcut" });
  const recorder = dialog.getByRole("textbox", { name: "Press your new key combination" });
  await recorder.press("-");
  assert((await dialog.getByRole("status").textContent())?.includes("Subtract clicked value"));
  assert(await dialog.getByRole("button", { name: "Save shortcut" }).isDisabled());
  await recorder.press("Control+l");
  assert((await dialog.getByRole("status").textContent())?.includes("reserved"));
  await recorder.press("Shift+Tab");
  assert(
    await dialog
      .getByRole("button", { name: "Cancel", exact: true })
      .evaluate((element) => element === document.activeElement),
  );
  await dialog.getByRole("button", { name: "Cancel", exact: true }).press("Tab");
  assert(await recorder.evaluate((element) => element === document.activeElement));
  await page.setViewportSize({ width: 320, height: 800 });
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ path: `${artifact}-shortcut-conflict.png` });
  await page.setViewportSize({ width: 1280, height: 800 });
  await recorder.press("Escape");
  assert(
    await page
      .getByRole("button", { name: "Edit Add clicked value:", exact: false })
      .evaluate((element) => element === document.activeElement),
  );
}
async function calculatorBindings(page: Page): Promise<void> {
  await edit(page, "Add clicked value", "Alt+a");
  await filteredEdit(page);
  await edit(page, "Undo the last calculator operation", "F8");
  await edit(page, "Clear calculator history and entry", "F9");
  await page.reload();
  await page.getByText("Saved locally", { exact: true }).waitFor();
  await openKeys(page);
  const modified = page.getByRole("checkbox", { name: "Modified only", exact: false });
  await modified.check();
  const modifiedCommandCount = 3;
  assert(
    (await page.getByRole("button", { name: editActionPattern }).count()) === modifiedCommandCount,
  );
  await modified.uncheck();
  await page.getByRole("button", { name: "comparisons", exact: true }).click();
  await page.getByLabel("Saved comparison", { exact: true }).selectOption({ label: "Two offers" });
  const cash = amountButton(page, "Cash after tax");
  await addCash(page);
  assert((await page.getByLabel("Calculator total").textContent())?.trim() === "77,480");
  assert((await page.getByRole("dialog").count()) === 0);
  await page.getByRole("heading", { name: "Two offers", exact: true }).click();
  await page.keyboard.press("F8");
  await page.keyboard.press("F8");
  assert((await page.getByLabel("Calculator total").textContent())?.trim() === "0");
  await addCash(page);
  await page.keyboard.press("F9");
  await page.keyboard.press("F9");
  assert((await page.getByLabel("Calculator total").textContent())?.trim() === "0");
  await page.keyboard.down("+");
  await cash.click();
  await page.keyboard.up("+");
  await page.getByRole("dialog", { name: "Calculation inspector" }).waitFor();
  await closeInspector(page);
  await openKeys(page);
}
async function settingsBindings(page: Page): Promise<void> {
  await edit(page, "Open Preferences", "Alt+g", "Alt+h");
  await page.keyboard.press("Alt+g");
  await page.keyboard.press("Alt+h");
  await page.getByRole("heading", { name: "Preferences", exact: true }).waitFor();
  await openKeys(page);
  await edit(page, "Open Keyboard shortcuts", "Alt+j", "Alt+g");
  await page.getByRole("button", { name: "Preferences", exact: true }).click();
  await page.keyboard.press("Alt+j");
  await page.keyboard.press("Alt+g");
  await page.getByRole("heading", { name: "Keyboard shortcuts", exact: true }).waitFor();
  await page.getByRole("button", { name: "Reset Open Keyboard shortcuts", exact: true }).click();
  await page.getByRole("status").filter({ hasText: "Shortcuts saved locally." }).waitFor();
  await edit(page, "Open Preferences", "Control+k", "Control+b");
  await page.keyboard.press("Control+k");
  await page.keyboard.press("Control+b");
  await page.getByRole("heading", { name: "Preferences", exact: true }).waitFor();
  await openKeys(page);
  await edit(page, "Open Keyboard shortcuts", "Control+Alt+9");
  await page.getByRole("button", { name: "Preferences", exact: true }).click();
  await page.keyboard.press("Control+Alt+9");
  await page.getByRole("heading", { name: "Keyboard shortcuts", exact: true }).waitFor();
  await page.getByRole("button", { name: "Remove Add clicked value:", exact: false }).click();
  await page.getByRole("status").filter({ hasText: "Shortcuts saved locally." }).waitFor();
  assert(
    (await page
      .getByRole("button", { name: "Remove Add clicked value:", exact: false })
      .count()) === 0,
  );
  await page.getByRole("button", { name: "Reset Add clicked value", exact: true }).click();
  await page.getByRole("status").filter({ hasText: "Shortcuts saved locally." }).waitFor();
  assert(
    await page.getByRole("button", { name: "Reset Add clicked value", exact: true }).isDisabled(),
  );
  const reset = page.getByRole("button", { name: "Reset all shortcuts", exact: true });
  await reset.press("Enter");
  await page.getByRole("status").filter({ hasText: "Shortcuts saved locally." }).waitFor();
  assert(await page.getByRole("button", { name: "Reset all shortcuts", exact: true }).isDisabled());
  await page.keyboard.press("Control+,");
  await page.getByRole("heading", { name: "Preferences", exact: true }).waitFor();
}
async function filteredEdit(page: Page): Promise<void> {
  const search = page.getByRole("searchbox", { name: "Search keyboard shortcuts" });
  await search.fill("Alt+A");
  await edit(page, "Add clicked value", "Alt+b");
  assert(await search.evaluate((element) => element === document.activeElement));
  await search.fill("");
  await edit(page, "Add clicked value", "Alt+a");
}
async function editableShortcutsFlow(page: Page, artifact: string): Promise<void> {
  await toolbarControls(page);
  await conflicts(page, artifact);
  await calculatorBindings(page);
  await settingsBindings(page);
  await saveConflict(page);
  await multipleShortcutsFlow(page, artifact);
  await calculatorChainsFlow(page, artifact);
}

async function toolbarControls(page: Page): Promise<void> {
  const group = page.getByRole("group", { name: "Shortcut list", exact: true });
  assert((await group.count()) === 1, "The filter must use the shared checkbox field");
  assert(await group.getByRole("checkbox", { name: "Modified only", exact: true }).isVisible());
  const reset = page.getByRole("button", { name: "Reset all shortcuts", exact: true });
  assert((await reset.textContent())?.trim() === "↺");
  assert(await reset.isDisabled());
}

async function saveConflict(page: Page): Promise<void> {
  await openKeys(page);
  await page.getByRole("button", { name: "Edit Add clicked value:", exact: false }).click();
  const other = await page.context().newPage();
  try {
    await other.goto(page.url());
    await other.getByText("Saved locally", { exact: true }).waitFor();
    await openKeys(other);
    await other
      .getByRole("button", { name: "Remove Multiply by clicked value:", exact: false })
      .click();
    await other.getByRole("status").filter({ hasText: "Shortcuts saved locally." }).waitFor();
    const dialog = page.getByRole("dialog", { name: "Change shortcut" });
    await dialog.getByRole("textbox", { name: "Press your new key combination" }).press("Alt+a");
    await dialog.getByRole("button", { name: "Save shortcut" }).click();
    await dialog.getByRole("alert").filter({ hasText: "Not saved." }).waitFor();
    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    const conflict = page.getByRole("region", { name: "Resolve conflicting edits" });
    await conflict.getByLabel("Keep stored version", { exact: true }).check();
    await conflict.getByRole("button", { name: "Resolve selected versions" }).click();
    await conflict.waitFor({ state: "hidden" });
    assert(
      (await page
        .getByRole("button", { name: "Remove Multiply by clicked value:", exact: false })
        .count()) === 0,
    );
    assert(
      await page.getByRole("button", { name: "Reset Add clicked value", exact: true }).isDisabled(),
    );
    await page.getByRole("button", { name: "Reset all shortcuts", exact: true }).click();
    await page.getByRole("status").filter({ hasText: "Shortcuts saved locally." }).waitFor();
  } finally {
    await other.close();
  }
}

export { editableShortcutsFlow, saveConflict };
