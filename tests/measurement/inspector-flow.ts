import assert from "node:assert/strict";
import type { Locator, Page } from "playwright";

function amountButton(page: Page, label: string, index = 0): Locator {
  return page.getByRole("button", { name: `Inspect ${label}:` }).nth(index);
}
async function followValue(popup: Locator, name: string): Promise<void> {
  const named = popup.getByRole("button", { name, exact: true });
  const row = popup.getByRole("button").filter({
    has: popup.page().getByText(name, { exact: true }),
  });
  const button = named.or(row).first();
  await button.focus();
  await button.press("Enter");
  await popup.locator("[data-node-heading] code").getByText(name, { exact: true }).waitFor();
  assert(
    await popup
      .locator("[data-node-heading]")
      .evaluate((element) => element === document.activeElement),
  );
}
async function closeInspector(page: Page): Promise<void> {
  await page.getByRole("dialog").getByRole("button", { name: "Close", exact: true }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
}

function formulaText(popup: Locator): Promise<string> {
  return popup
    .locator("article > section[aria-label='Calculation breakdown'] .formula")
    .evaluate((element) => {
      const copy = element.cloneNode(true);
      if (!(copy instanceof Element)) {
        throw new Error("Formula element missing");
      }
      for (const tooltip of copy.querySelectorAll("[role=tooltip]")) {
        tooltip.remove();
      }
      return copy.textContent ?? "";
    })
    .then((text) => text.trim());
}

export { amountButton, closeInspector, followValue, formulaText };
