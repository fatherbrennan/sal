import assert from "node:assert/strict";
import type { Locator, Page } from "playwright";
import { followValue } from "./inspector-flow.ts";

async function navigationFlow(page: Page, popup: Locator, artifact: string | null): Promise<void> {
  const chain = [
    "annual_net_package_value",
    "annual_cash_after_tax",
    "annual_cash_before_tax",
    "annual_cash_pay",
    "selected_pay_item_cash_before_cap",
    "annual_base_cash_before_cap",
    "annual_base_pay_quote",
  ];
  await chain.reduce(async (previous, name) => {
    await previous;
    await followValue(popup, name);
  }, Promise.resolve());
  assert((await popup.locator("article").textContent())?.includes("112,000"));
  const trail = popup.getByRole("navigation", { name: "Exploration trail" });
  assert((await trail.getByRole("button").count()) === chain.length + 1);
  if (artifact !== null) {
    await page.screenshot({ path: `${artifact}-variable-source.png` });
  }
  await popup.getByRole("button", { name: "Back one step", exact: true }).click();
  assert((await trail.getByRole("button").count()) === chain.length);
  await trail.getByRole("button", { name: "annual_cash_pay", exact: true }).click();
  const shortened = 5;
  assert((await trail.getByRole("button").count()) === shortened);
  assert((await trail.textContent())?.includes("annual_base_pay_quote") === false);
  await trail.getByRole("button").first().click();
  assert((await trail.getByRole("button").count()) === 1);
  assert(await popup.getByRole("button", { name: "Back one step", exact: true }).isDisabled());
}

export { navigationFlow };
