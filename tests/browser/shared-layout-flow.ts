import assert from "node:assert/strict";
import type { Page } from "playwright";
import { navigateTo } from "../measurement/navigation.ts";

const wideViewport = { width: 2560, height: 1440 };
const minimumShellShare = 0.95;
const minimumOfferShare = 0.8;
const minimumSettingsShare = 0.9;
const invalidNameLength = 32_001;

async function resizeComparison(page: Page, artifact: string): Promise<void> {
  const viewport = page.viewportSize();
  assert(viewport);
  const scrollbar = page.getByRole("scrollbar", { name: "Scroll comparison horizontally" });
  await scrollbar.focus();
  await scrollbar.press("End");
  await page.setViewportSize(wideViewport);
  await Promise.all(
    [".header-inner", "main"].map(async (selector) => {
      const box = await page.locator(selector).boundingBox();
      assert(
        box && box.width > wideViewport.width * minimumShellShare,
        `${selector} must use the wide screen`,
      );
    }),
  );
  assert(
    await page
      .getByRole("navigation", { name: "Main navigation", exact: true })
      .evaluate((element) => {
        const box = element.getBoundingClientRect();
        const header = element.closest("header")?.getBoundingClientRect();
        return (
          header &&
          box.left >= header.left &&
          box.right <= header.right &&
          box.bottom <= header.bottom
        );
      }),
    "Navigation must fit alongside the brand and save status",
  );
  await page.getByText("All 6 offers visible", { exact: true }).waitFor();
  assert(
    await page.getByRole("button", { name: "Scroll comparison left", exact: true }).isDisabled(),
  );
  assert(
    await page.getByRole("button", { name: "Scroll comparison right", exact: true }).isDisabled(),
  );
  await comparisonSurface(page, artifact);
  await page.screenshot({ path: `${artifact}-wide.png` });
  await page.setViewportSize(viewport);
  await scrollbar.focus();
  await scrollbar.press("Home");
  await page.waitForFunction(
    () => document.querySelector('[aria-label="Salary comparison"]')?.scrollLeft === 0,
  );
}

async function comparisonSurface(page: Page, artifact: string): Promise<void> {
  await page.getByRole("button", { name: "Collapse details", exact: true }).click();
  await (["light", "dark"] as const).reduce(async (previous, colorScheme) => {
    await previous;
    await page.emulateMedia({ colorScheme });
    await page.screenshot({ path: `${artifact}-categories-${colorScheme}.png`, fullPage: true });
    const surface = await page.locator(".scroll-navigation").evaluate((element) => {
      const position = element.querySelector(".scroll-position");
      const bar = element.querySelector('[role="scrollbar"]');
      const minimumInset = 8;
      const borders = [...document.querySelectorAll(".group-heading td")].map((cell) =>
        getComputedStyle(cell).borderBottomColor.match(/\d+/gu),
      );
      return {
        inset:
          position !== null &&
          position.getBoundingClientRect().left - element.getBoundingClientRect().left >=
            minimumInset,
        noEmptyTrack: bar !== null && !bar.checkVisibility(),
        neutralCategories:
          borders.length > 0 &&
          borders.every((channels) => channels?.every((channel) => channel === channels[0])),
      };
    });
    assert(
      surface.inset && surface.noEmptyTrack && surface.neutralCategories,
      JSON.stringify(surface),
    );
  }, Promise.resolve());
  await page.emulateMedia({ colorScheme: "light" });
}

async function sharedLayoutFlow(page: Page, artifact: string): Promise<void> {
  await comparisonSelection(page);
  await page.setViewportSize(wideViewport);
  await page.getByRole("button", { name: "offers", exact: true }).click();
  await page.getByRole("button", { name: "Remote offer", exact: true }).click();
  assert(await page.getByRole("complementary", { name: "Saved records" }).isVisible());
  const offer = await page.getByRole("region", { name: "Selected record" }).boundingBox();
  assert(
    offer && offer.width > wideViewport.width * minimumOfferShare,
    "Offer fields must use the wide screen",
  );
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ path: `${artifact}-offer-wide.png` });
  await ["Personal tax settings", "vehicle", "Preferences"].reduce(async (previous, tab) => {
    await previous;
    await navigateTo(page, tab);
    const settings = page.getByRole("region", { name: "Shared settings" });
    const box = await settings.boundingBox();
    assert(
      box && box.width > wideViewport.width * minimumSettingsShare,
      "Settings must use the wide screen",
    );
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: `${artifact}-${tab}.png` });
  }, Promise.resolve());
  await navigateTo(page, "Backups");
  assert(await page.getByRole("region", { name: "Export backup", exact: true }).isVisible());
  assert(await page.getByRole("region", { name: "Import backup", exact: true }).isVisible());
  await page.screenshot({ path: `${artifact}-backups.png` });
}

async function comparisonSelection(page: Page): Promise<void> {
  await page.locator(".comparison-setup > summary").click();
  const name = page.getByLabel("Comparison name", { exact: true });
  await name.fill("x".repeat(invalidNameLength));
  await name.press("Tab");
  const selection = page.getByLabel("Saved comparison", { exact: true });
  await selection.selectOption({ label: "Other comparison" });
  assert((await selection.inputValue()) === "compare-a");
  assert((await name.inputValue()).length === invalidNameLength);
  assert(await page.getByRole("button", { name: "Revert field", exact: true }).isVisible());
  await page.getByRole("button", { name: "Revert field", exact: true }).click();
  await selection.selectOption({ label: "Other comparison" });
  await page.getByRole("heading", { name: "Other comparison", exact: true }).waitFor();
}

export { resizeComparison, sharedLayoutFlow };
