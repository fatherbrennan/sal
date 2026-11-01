import assert from "node:assert/strict";
import type { Page } from "playwright";
import { importFixture } from "../measurement/compare-flow.ts";
import { backupFixture } from "../measurement/fixtures.ts";
import { resizeComparison } from "./shared-layout-flow.ts";
import { topLeftTooltip } from "./tooltip-flow.ts";

const extraOffers = ["3", "4", "5", "6"];
const keyResults = 1;
const pageScroll = 500;

function sixOffers() {
  const fixture = backupFixture();
  const original = fixture.records.find((record) => record.kind === "offer");
  const comparison = fixture.records.find((record) => record.kind === "comparison");
  assert(original && comparison);
  const { offers: selectedOffers } = comparison.items;
  assert(selectedOffers);
  for (const number of extraOffers) {
    const offer = { ...original, id: `layout-${number}`, name: `Layout offer ${number}` };
    fixture.records.push(offer);
    selectedOffers.push({ id: offer.id, fields: { offerId: offer.id } });
  }
  comparison.name = "Six offers";
  fixture.records.push({ ...comparison, id: "layout-other", name: "Other comparison" });
  return fixture;
}

async function comparisonLayoutFlow(page: Page, artifact: string): Promise<void> {
  await importFixture(page, sixOffers());
  await page.getByRole("button", { name: "comparisons", exact: true }).click();
  await page.getByLabel("Saved comparison", { exact: true }).selectOption({ label: "Six offers" });
  const table = page.getByRole("region", { name: "Salary comparison", exact: true });
  await detailActionIcons(page);
  assert(
    await table.evaluate((element) => element.scrollHeight <= element.clientHeight + 1),
    "The page must own vertical comparison scrolling, without a second vertical viewport",
  );
  assert(
    await table.evaluate((element) => {
      const main = document.querySelector("main");
      if (!main) {
        return false;
      }
      const style = getComputedStyle(main);
      const width =
        main.clientWidth -
        Number.parseFloat(style.paddingLeft) -
        Number.parseFloat(style.paddingRight);
      return Math.abs(element.clientWidth - width) < 2;
    }),
    "Comparison results must use the main content width",
  );
  await page.getByRole("button", { name: "Collapse details", exact: true }).click();
  assert((await table.locator(".key-result:visible").count()) === keyResults);
  assert((await table.locator('.group-heading button[aria-expanded="true"]').count()) === 0);
  assert((await table.locator(".overview-context:visible").count()) === 0);
  await categoryRow(page);
  await page.getByRole("button", { name: "Expand all details", exact: true }).click();
  assert((await table.locator('.group-heading button[aria-expanded="false"]').count()) === 0);
  await table.evaluate((element, distance) => {
    globalThis.scrollTo(0, element.getBoundingClientRect().top + scrollY + distance);
  }, pageScroll);
  await page.waitForFunction(() => {
    const head = document.querySelector(".sticky-heading thead");
    const app = document.querySelector("header");
    const actions = document.querySelector(".detail-actions");
    return (
      head &&
      app &&
      actions &&
      Math.abs(actions.getBoundingClientRect().top - app.getBoundingClientRect().bottom) < 2 &&
      Math.abs(head.getBoundingClientRect().top - actions.getBoundingClientRect().bottom) < 2
    );
  });
  await horizontalNavigation(page, artifact);
  await stickyDetailActions(page);
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.evaluate(() => globalThis.scrollTo(0, 0));
  await page.screenshot({ path: `${artifact}-top.png` });
  await resizeComparison(page, artifact);
}

async function stickyDetailActions(page: Page): Promise<void> {
  const table = page.getByRole("region", { name: "Salary comparison", exact: true });
  const collapse = page.getByRole("button", { name: "Collapse details", exact: true });
  assert(
    await collapse.evaluate((element) => {
      const box = element.getBoundingClientRect();
      return document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2) === element;
    }),
    "Detail controls must remain reachable after vertical and horizontal scrolling",
  );
  await collapse.focus();
  await collapse.press("Enter");
  assert((await table.locator('.group-heading button[aria-expanded="true"]').count()) === 0);
  await page.getByRole("button", { name: "Expand all details", exact: true }).press("Enter");
  assert((await table.locator('.group-heading button[aria-expanded="false"]').count()) === 0);
}

async function detailActionIcons(page: Page): Promise<void> {
  const expand = page.getByRole("button", { name: "Expand all details", exact: true });
  const collapse = page.getByRole("button", { name: "Collapse details", exact: true });
  assert((await expand.textContent())?.trim() === "⊞");
  assert((await collapse.textContent())?.trim() === "⊟");
  await topLeftTooltip(expand, "Expand all details");
  await topLeftTooltip(collapse, "Collapse details");
  assert(
    await expand.evaluate((element) => {
      const box = element.getBoundingClientRect();
      return box.width === box.height && getComputedStyle(element).cursor === "pointer";
    }),
  );
}

async function horizontalNavigation(page: Page, artifact: string): Promise<void> {
  const table = page.getByRole("region", { name: "Salary comparison", exact: true });
  const navigation = page.getByRole("region", { name: "Comparison horizontal navigation" });
  assert(
    await navigation.evaluate((element) => {
      const box = element.getBoundingClientRect();
      return box.top >= 0 && box.bottom <= innerHeight + 1;
    }),
    "Horizontal navigation must remain visible while reading lower rows",
  );
  const right = page.getByRole("button", { name: "Scroll comparison right", exact: true });
  assert((await right.textContent())?.trim() === "❯");
  await topLeftTooltip(right, "Scroll comparison right");
  await right.focus();
  await right.press("Enter");
  await page.waitForFunction(() => {
    const region = document.querySelector('[aria-label="Salary comparison"]');
    return region && region.scrollLeft > 0;
  });
  assert(
    await table
      .locator(".key-result th")
      .first()
      .evaluate((element) => {
        const region = element.closest("section");
        return (
          region &&
          Math.abs(element.getBoundingClientRect().left - region.getBoundingClientRect().left) < 2
        );
      }),
    "Metric labels must stay visible after horizontal navigation",
  );
  await table.evaluate((element) => {
    element.scrollLeft = element.scrollWidth;
  });
  await page.waitForFunction(() =>
    document.querySelector('[aria-label="Scroll comparison right"]')?.hasAttribute("disabled"),
  );
  assert((await navigation.textContent())?.includes("of 6"));
  assert((await navigation.textContent())?.includes("End of offers"));
  assert(
    await table.evaluate((element) => {
      const visual = [...document.querySelectorAll(".sticky-heading th")];
      return [...element.querySelectorAll("thead th")].every((cell, index) => {
        const heading = visual[index];
        return (
          heading &&
          Math.abs(heading.getBoundingClientRect().left - cell.getBoundingClientRect().left) < 2
        );
      });
    }),
    "Sticky headings must stay aligned with their offer columns",
  );
  await page.screenshot({ path: `${artifact}-scrolled.png` });
  await categoryRow(page);
  await nativeScrollbarNavigation(page);
}

async function categoryRow(page: Page): Promise<void> {
  const table = page.getByRole("region", { name: "Salary comparison", exact: true });
  const button = table.getByRole("button", { name: "Pay, super and package value" });
  const cell = table.locator(".group-heading td").filter({
    has: page.getByRole("button", { name: "Pay, super and package value" }),
  });
  const scrollLeft = await table.evaluate((element) => element.scrollLeft);
  await cell.evaluate((element) => element.scrollIntoView({ block: "center", inline: "nearest" }));
  const bounds = await cell.boundingBox();
  const viewport = await table.boundingBox();
  assert(bounds && viewport);
  const original = await button.getAttribute("aria-expanded");
  const edgeInset = 3;
  await page.mouse.click(
    Math.min(bounds.x + bounds.width, viewport.x + viewport.width) - edgeInset,
    bounds.y + edgeInset,
  );
  assert(
    (await button.getAttribute("aria-expanded")) !== original,
    "The row edge must toggle details",
  );
  assert(await button.evaluate((element) => element === document.activeElement));
  await button.press("Enter");
  assert((await button.getAttribute("aria-expanded")) === original);
  await button.press("Space");
  assert((await button.getAttribute("aria-expanded")) !== original);
  await button.press("Space");
  assert((await button.getAttribute("aria-expanded")) === original);
  assert(Math.abs((await table.evaluate((element) => element.scrollLeft)) - scrollLeft) < 2);
  assert(
    await button.evaluate((element) => {
      const region = element.closest(".table-scroll");
      if (!region) {
        return false;
      }
      const range = document.createRange();
      range.selectNodeContents(element);
      const label = range.getBoundingClientRect();
      const visible = region.getBoundingClientRect();
      return label.left >= visible.left && label.right <= visible.right;
    }),
    "The category label must remain visible after horizontal scrolling",
  );
}

async function nativeScrollbarNavigation(page: Page): Promise<void> {
  const scrollbar = page.getByRole("scrollbar", { name: "Scroll comparison horizontally" });
  await scrollbar.evaluate((element) => {
    element.scrollLeft = 0;
  });
  await page.waitForFunction(
    () => document.querySelector('[aria-label="Salary comparison"]')?.scrollLeft === 0,
  );
  await scrollbar.focus();
  await scrollbar.press("ArrowRight");
  await page.waitForFunction(() => {
    const region = document.querySelector('[aria-label="Salary comparison"]');
    return region && region.scrollLeft > 0;
  });
}

export { comparisonLayoutFlow };
