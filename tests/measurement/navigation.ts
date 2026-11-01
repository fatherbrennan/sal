import type { Page } from "playwright";

async function navigateTo(page: Page, name: string): Promise<void> {
  const main = page.getByRole("navigation", { name: "Main navigation", exact: true });
  if (["Preferences", "Offer defaults", "Backups", "Keyboard shortcuts"].includes(name)) {
    await main.getByRole("button", { name: "Settings", exact: true }).click();
    await page
      .getByRole("navigation", { name: "Settings sections", exact: true })
      .getByRole("button", { name, exact: true })
      .click();
  } else {
    await main.getByRole("button", { name, exact: true }).click();
  }
}

async function selectScenario(page: Page, label: string): Promise<void> {
  await page.getByRole("combobox", { name: "Earnings scenario", exact: true }).click();
  await page
    .getByRole("listbox", { name: "Earnings scenario", exact: true })
    .getByRole("option", { name: label, exact: true })
    .click();
}

export { navigateTo, selectScenario };
