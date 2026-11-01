import assert from "node:assert/strict";
import type { Page } from "playwright";
import { dispatchKey } from "./shortcut-audit-calculator.ts";

async function controlAudit(page: Page): Promise<void> {
  await page.addScriptTag({ type: "module", url: "/tests/browser/fixtures/shortcut-entry.ts" });
  const region = page.getByRole("region", { name: "Shortcut control audit" });
  const button = region.getByRole("button", { name: "Audit button", exact: true });
  await button.press("Enter");
  await button.press("Space");
  assert((await region.getByLabel("Audit activations").textContent()) === "2");
  assert(await region.getByRole("button", { name: "Disabled audit button" }).isDisabled());
  const summary = region.getByText("Audit disclosure", { exact: true });
  await summary.press("Enter");
  assert(await region.getByText("Audit details", { exact: true }).isVisible());
  await summary.press("Space");
  assert(!(await region.getByText("Audit details", { exact: true }).isVisible()));
  const checkbox = region.getByRole("checkbox", { name: "Audit checkbox", exact: true });
  await checkbox.press("Space");
  assert(await checkbox.isChecked());
  await checkbox.press("Enter");
  assert(await checkbox.isChecked(), "Enter does not toggle a native checkbox");
  await checkbox.press("Space");
  assert(!(await checkbox.isChecked()));
  const a = region.getByRole("radio", { name: "Audit radio A" });
  const c = region.getByRole("radio", { name: "Audit radio C" });
  await a.press("ArrowRight");
  assert(await c.isChecked(), "Skip disabled radios");
  await c.press("ArrowDown");
  assert(await a.isChecked(), "Wrap in the same named group");
  await a.press("ArrowLeft");
  assert(await c.isChecked());
  await c.press("ArrowUp");
  assert(await a.isChecked());
  assert(await region.getByRole("radio", { name: "Other radio group" }).isChecked());
  await region.getByRole("link", { name: "Audit link", exact: true }).press("Enter");
  assert(new URL(page.url()).hash === "#audit-link-destination");
  await comboboxAudit(page);
  const hint = region.getByRole("button", { name: "Audit hint", exact: true });
  await hint.focus();
  const tooltip = page.getByRole("tooltip", { name: "Audit tooltip", exact: true });
  await tooltip.waitFor();
  await hint.press("Shift+Escape");
  assert(await tooltip.isVisible());
  await hint.press("Escape");
  await tooltip.waitFor({ state: "hidden" });
}

async function comboboxAudit(page: Page): Promise<void> {
  const search = page.getByRole("combobox", { name: "Audit single selection" });
  const selection = page.getByLabel("Audit selection", { exact: true });
  await search.focus();
  await search.press("Enter");
  assert((await selection.textContent()) === "", "No selection without a highlighted option");
  await search.fill("no matching option");
  await search.press("ArrowDown");
  await search.press("ArrowUp");
  await search.press("Enter");
  assert((await selection.textContent()) === "");
  await search.fill("");
  const ignored = await search.evaluate((input) =>
    [
      { ctrlKey: true },
      { metaKey: true },
      { altKey: true },
      { shiftKey: true },
      { isComposing: true },
    ].map((options) => {
      const event = new KeyboardEvent("keydown", {
        key: "ArrowDown",
        bubbles: true,
        cancelable: true,
        ...options,
      });
      input.dispatchEvent(event);
      return event.defaultPrevented;
    }),
  );
  assert(ignored.every((value) => !value));
  assert((await search.getAttribute("aria-activedescendant")) === null);
  await search.press("ArrowDown");
  await search.press("ArrowUp");
  await search.press("ArrowUp");
  await search.press("ArrowDown");
  await search.press("Enter");
  assert((await selection.textContent()) === "Gamma");
  assert((await search.getAttribute("aria-expanded")) === "false");
  await search.press("ArrowDown");
  await search.press("Shift+Tab");
  assert((await search.getAttribute("aria-expanded")) === "false");
  await search.focus();
  await search.press("Tab");
  assert((await search.getAttribute("aria-expanded")) === "false");
  const disable = page.getByRole("checkbox", { name: "Disable audit combobox" });
  await disable.press("Space");
  assert(await disable.isChecked());
  await search.focus();
  assert(!(await dispatchKey(search, "ArrowDown")));
  assert((await search.getAttribute("aria-expanded")) === "false");
  await multiselectAudit(page);
}

async function multiselectAudit(page: Page): Promise<void> {
  const multi = page.getByRole("combobox", { name: "Audit multiple selection" });
  const options = page.getByRole("region", { name: "Shortcut control audit" }).getByRole("listbox");
  await multi.press("ArrowDown");
  await multi.press("Enter");
  assert((await multi.getAttribute("aria-expanded")) === "true");
  assert((await options.getByRole("option", { selected: true }).count()) === 1);
  await multi.press("Enter");
  assert((await options.getByRole("option", { selected: true }).count()) === 0);
  await multi.press("Escape");
  assert((await multi.getAttribute("aria-expanded")) === "false");
}

export { controlAudit };
