import assert from "node:assert/strict";
import type { Locator, Page } from "playwright";

const desktop = { width: 1440, height: 1000 };
const narrow = { width: 320, height: 800 };
const rowTolerance = 2;

async function footerFlow(page: Page, artifact: string): Promise<void> {
  const footer = page.locator("footer");
  const extraBorders = await footer.evaluate(
    (element) =>
      [element, ...element.querySelectorAll(":scope > div, :scope > details")].filter(
        (child) => Number.parseFloat(getComputedStyle(child).borderTopWidth) > 0,
      ).length,
  );
  assert(extraBorders === 0, "The footer must not repeat the preceding section divider");
  const tax = page.getByText("Tax calculations and offer limitations", { exact: true });
  await tax.click();
  const nestedBorders = await page
    .locator(".tax-details")
    .evaluate((element) =>
      [
        ...element.querySelectorAll(
          "details > details:last-child, details > :last-child > details:last-child",
        ),
      ]
        .filter((child) => Number.parseFloat(getComputedStyle(child).borderBottomWidth) > 0)
        .map((child) => child.querySelector("summary")?.textContent),
    );
  assert(nestedBorders.length === 0, `Repeated nested dividers: ${nestedBorders.join(", ")}`);
  await tax.click();
  await footerInformation(page, artifact);
}

async function footerInformation(page: Page, artifact: string): Promise<void> {
  const footer = page.locator("footer");
  const disclosure = footer.locator("details");
  const summary = disclosure.locator("summary");
  assert((await disclosure.getAttribute("open")) === null);
  assert(
    await footer.getByText("Local only · No account or cloud sync", { exact: true }).isVisible(),
  );
  const info = await footer.locator(".app-info").boundingBox();
  const status = await summary.boundingBox();
  assert(info && status);
  assert(
    Math.abs(info.y + info.height / 2 - status.y - status.height / 2) <= rowTolerance,
    "Footer information aligns in one desktop row",
  );
  await footer.screenshot({ path: `${artifact}-footer.png` });
  await centeredStatus(summary);
  await summary.focus();
  await summary.press("Enter");
  await singleFocusRing(summary);
  await centeredStatus(summary);
  assert((await disclosure.getAttribute("open")) === "");
  assert(await disclosure.locator("p").first().isVisible());
  await summary.press("Enter");
  assert((await disclosure.getAttribute("open")) === null);
  await page.setViewportSize(narrow);
  await (["light", "dark"] as const).reduce(async (previous, colorScheme) => {
    await previous;
    await page.emulateMedia({ colorScheme });
    assert(await footer.evaluate((element) => element.scrollWidth <= element.clientWidth));
    await centeredStatus(summary);
    await footer.screenshot({ path: `${artifact}-footer-${colorScheme}-320.png` });
  }, Promise.resolve());
  await page.setViewportSize(desktop);
  await page.emulateMedia({ colorScheme: "light" });
  await settingsFocus(page, artifact);
}

async function centeredStatus(summary: Locator): Promise<void> {
  // Read one layout snapshot while the viewport is resizing.
  const [bounds, ...content] = await summary.evaluate((element) =>
    [element, ...element.querySelectorAll(":scope > span")].map((node) => {
      const rect = node.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    }),
  );
  assert(bounds && bounds.width > 0 && bounds.height > 0 && content.length > 0);
  const centerY = bounds.y + bounds.height / 2;
  assert(
    content.every((rect) => Math.abs(rect.y + rect.height / 2 - centerY) <= 1),
    "The status icon and text are vertically centered",
  );
  const left = Math.min(...content.map((rect) => rect.x));
  const right = Math.max(...content.map((rect) => rect.x + rect.width));
  assert(
    Math.abs((left + right) / 2 - bounds.x - bounds.width / 2) <= 1,
    "The status icon and text are centered together horizontally",
  );
}

async function singleFocusRing(control: Locator): Promise<void> {
  await control.focus();
  await control.page().keyboard.press("Shift+Tab");
  await control.page().keyboard.press("Tab");
  const style = await control.evaluate((element) => {
    const computed = getComputedStyle(element);
    return {
      focused: element.matches(":focus-visible"),
      width: Number.parseFloat(computed.outlineWidth),
      offset: Number.parseFloat(computed.outlineOffset),
      outline: computed.outlineStyle,
      border: computed.borderStyle,
    };
  });
  assert(style.focused, "Keyboard focus remains visible");
  assert(style.width >= rowTolerance && style.outline === "solid", "Focus has a clear solid edge");
  assert(
    style.offset <= -style.width,
    "Focus overlaps the control edge instead of adding an outer box",
  );
  assert(style.border !== "double", "Controls do not use double borders");
}

async function settingsFocus(page: Page, artifact: string): Promise<void> {
  const settings = page
    .getByRole("navigation", { name: "Main navigation", exact: true })
    .getByRole("button", { name: "Settings", exact: true });
  await settings.focus();
  await settings.press("Enter");
  await singleFocusRing(settings);
  const preferences = page
    .getByRole("navigation", { name: "Settings sections", exact: true })
    .getByRole("button", { name: "Preferences", exact: true });
  await preferences.focus();
  await preferences.press("Space");
  await preferences.focus();
  await singleFocusRing(preferences);
  await page.screenshot({ path: `${artifact}-settings-focus.png` });
}

export { footerFlow };
