import assert from "node:assert/strict";
import type { Page } from "playwright";
import { saveSettled } from "../measurement/edit-flow.ts";
import { navigateTo } from "../measurement/navigation.ts";
import { saveConflict } from "./editable-shortcuts-flow.ts";
import { dispatchKey } from "./shortcut-audit-calculator.ts";

async function dialogAudit(page: Page): Promise<void> {
  await recorderAudit(page);
  await saveConflict(page);
  await settingsInputAudit(page);
  await widthAudit(page);
  await placementAudit(page);
}

async function recorderAudit(page: Page): Promise<void> {
  await navigateTo(page, "Keyboard shortcuts");
  await page.getByRole("button", { name: "Edit Add clicked value:", exact: false }).click();
  const dialog = page.getByRole("dialog", { name: "Change shortcut" });
  const input = dialog.getByRole("textbox");
  await input.press("Enter");
  assert(await dialog.isVisible(), "Incomplete recording cannot be saved");
  const ignored = async (options: KeyboardEventInit) => {
    await dispatchKey(input, "Escape", options);
    assert(await dialog.isVisible(), "Recording ignores repeated/composing/AltGraph Escape");
  };
  await ignored({ repeat: true });
  await ignored({ isComposing: true });
  await ignored({ modifierAltGraph: true });
  await input.press("Control+l");
  await input.press("Enter");
  assert(await dialog.isVisible(), "Reserved recording cannot be saved");
  await input.press("Shift");
  await input.press("Alt+a");
  await input.press("Enter");
  await dialog.waitFor({ state: "hidden" });
  await page.getByRole("status").filter({ hasText: "Shortcuts saved locally." }).waitFor();
  await page.getByRole("button", { name: "Reset Add clicked value", exact: true }).click();
  await saveSettled(page);
  await page.getByRole("button", { name: "Edit Add clicked value:", exact: false }).click();
  await dialog.getByRole("button", { name: "Cancel", exact: true }).focus();
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "Edit Open Preferences:", exact: false }).click();
  await dialog.getByRole("checkbox", { name: "Two-step sequence" }).check();
  await input.press("Alt+g");
  await input.press("Alt+h");
  assert((await input.inputValue()) === "Alt+G then Alt+H");
  await input.press("Tab");
  assert(!(await input.evaluate((element) => document.activeElement === element)));
  await input.focus();
  await input.press("Escape");
  await dialog.waitFor({ state: "hidden" });
}

async function settingsInputAudit(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Edit Open Preferences:", exact: false }).click();
  const dialog = page.getByRole("dialog", { name: "Change shortcut" });
  const recorder = dialog.getByRole("textbox");
  await recorder.press("F8");
  await recorder.press("Enter");
  await dialog.waitFor({ state: "hidden" });
  await saveSettled(page);
  const search = page.getByRole("searchbox", { name: "Search keyboard shortcuts" });
  await search.focus();
  assert(!(await dispatchKey(search, "F8")), "Unmodified Settings binding yields to input");
  await page.getByRole("heading", { name: "Keyboard shortcuts", exact: true }).focus();
  await page.keyboard.press("F8");
  await page.getByRole("heading", { name: "Preferences", exact: true }).waitFor();
  await page.keyboard.press("Control+k");
  await page.keyboard.press("Control+s");
  await page.getByRole("button", { name: "Reset Open Preferences", exact: true }).click();
  await saveSettled(page);
  await search.focus();
  await search.press("Control+,");
  await page.getByRole("heading", { name: "Preferences", exact: true }).waitFor();
}

async function widthAudit(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Adjust page width", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Page width", exact: true });
  const slider = dialog.getByRole("slider");
  assert(
    await slider.evaluate((element) => {
      if (!(element instanceof HTMLInputElement)) {
        throw new Error("Missing width input");
      }
      element.value = "95";
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
      const modal = element.closest("dialog");
      modal?.dispatchEvent(new Event("cancel", { cancelable: true }));
      return modal?.open;
    }),
    "Cancel during the real pending save must keep the dialog open",
  );
  await saveSettled(page);
  await slider.press("End");
  await saveSettled(page);
  await slider.press("Shift+Tab");
  const close = dialog.getByRole("button", { name: "Close", exact: true });
  assert(await close.evaluate((element) => document.activeElement === element));
  await close.press("Tab");
  assert(await slider.evaluate((element) => document.activeElement === element));
  await slider.press("Escape");
  await dialog.waitFor({ state: "hidden" });
}

async function placementAudit(page: Page): Promise<void> {
  const panel = page.getByRole("complementary", { name: "Quick calculator" });
  const move = panel.getByRole("button", { name: "Move calculator", exact: true });
  await move.click();
  const dialog = page.getByRole("dialog", { name: "Place calculator" });
  const cancel = dialog.getByRole("button", { name: "Cancel placement", exact: true });
  await cancel.press("Tab");
  const first = dialog.getByRole("button", { name: "Top left", exact: true });
  assert(await first.evaluate((element) => element === document.activeElement));
  await first.press("Shift+Tab");
  assert(await cancel.evaluate((element) => element === document.activeElement));
  await cancel.press("Escape");
  await dialog.waitFor({ state: "hidden" });
  const before = await panel.boundingBox();
  const bounds = await move.boundingBox();
  assert(before && bounds);
  await move.focus();
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.mouse.down();
  const distance = 100;
  await page.mouse.move(bounds.x + distance, bounds.y - distance);
  await page.keyboard.press("Escape");
  await page.mouse.up();
  const after = await panel.boundingBox();
  assert(after && after.x === before.x && after.y === before.y, "Escape cancels the drag");
}

export { dialogAudit };
