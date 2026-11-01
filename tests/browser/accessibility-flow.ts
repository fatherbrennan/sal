import assert from "node:assert/strict";
import type { Page } from "playwright";
import { navigateTo } from "../measurement/navigation.ts";

const components = /\d+(?:\.\d+)?/gu;
const srgb = {
  scale: 255,
  breakpoint: 0.040_45,
  divisor: 12.92,
  offset: 0.055,
  factor: 1.055,
  exponent: 2.4,
  red: 0.2126,
  green: 0.7152,
  blue: 0.0722,
  floor: 0.05,
};
const minimum = { text: 4.5, control: 3 };
function luminance(color: string): number {
  const [red, green, blue] = (color.match(components) ?? []).map((text) => {
    const channel = Number(text) / srgb.scale;
    if (channel <= srgb.breakpoint) {
      return channel / srgb.divisor;
    }
    return ((channel + srgb.offset) / srgb.factor) ** srgb.exponent;
  });
  assert(red !== undefined && green !== undefined && blue !== undefined, color);
  return red * srgb.red + green * srgb.green + blue * srgb.blue;
}
function contrast(first: string, second: string): number {
  const a = luminance(first);
  const b = luminance(second);
  return (Math.max(a, b) + srgb.floor) / (Math.min(a, b) + srgb.floor);
}
async function palette(page: Page, appearance: string): Promise<void> {
  const colors = await page.evaluate((mode) => {
    document.documentElement.setAttribute("data-appearance", mode);
    const probe = document.createElement("span");
    document.body.append(probe);
    const resolvedColors = Object.fromEntries(
      [
        "text",
        "muted",
        "accent",
        "danger",
        "success",
        "equation-value",
        "line",
        "panel",
        "background",
        "soft",
      ].map((key) => {
        probe.style.color = `var(--${key})`;
        return [key, getComputedStyle(probe).color];
      }),
    );
    probe.remove();
    return resolvedColors;
  }, appearance);
  assert(
    (await page.locator("html").evaluate((element) => getComputedStyle(element).colorScheme)) ===
      appearance,
  );
  for (const foreground of ["text", "muted", "accent", "danger", "success", "equation-value"]) {
    for (const background of ["panel", "background", "soft"]) {
      assert(
        contrast(colors[foreground] ?? "", colors[background] ?? "") >= minimum.text,
        `${appearance}: ${foreground}/${background}`,
      );
    }
  }
  const { line = "", panel = "" } = colors;
  assert(contrast(line, panel) >= minimum.control, `${appearance}: input boundary`);
}
async function squareCorners(page: Page): Promise<void> {
  const roundedElements = await page.evaluate(() =>
    [...document.querySelectorAll("*")]
      .filter((element) => {
        const styles = [getComputedStyle(element)];
        if (element instanceof HTMLInputElement && element.type === "file") {
          styles.push(getComputedStyle(element, "::file-selector-button"));
        }
        return styles.some((style) =>
          [
            style.borderTopLeftRadius,
            style.borderTopRightRadius,
            style.borderBottomLeftRadius,
            style.borderBottomRightRadius,
          ].some((radius) => radius !== "0px"),
        );
      })
      .map((element) => element.tagName),
  );
  assert(
    roundedElements.length === 0,
    `Rounded application elements: ${roundedElements.join(", ")}`,
  );
}
async function accessibilityFlow(page: Page): Promise<void> {
  await squareCorners(page);
  await navigateTo(page, "Backups");
  await squareCorners(page);
  await palette(page, "light");
  await palette(page, "dark");
  await page.evaluate(() => document.documentElement.setAttribute("data-appearance", "system"));
  await newOfferFromKeyboard(page);
  await page.getByRole("heading", { name: "New offer", exact: true }).waitFor();
  await page.getByLabel("Name", { exact: true }).focus();
  await page.keyboard.type("Keyboard draft");
  await page.keyboard.press("Tab");
  await page.getByRole("heading", { name: "Keyboard draft", exact: true }).waitFor();
  assert((await page.locator("main").ariaSnapshot()).includes('textbox "Name"'));
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.evaluate(() => globalThis.scrollTo(0, document.body.scrollHeight));
  const header = await page.getByRole("banner").boundingBox();
  assert(
    header !== null && header.y >= 0 && header.y < 1,
    "Header must remain visible while scrolling",
  );
}

async function newOfferFromKeyboard(page: Page): Promise<void> {
  await page.getByRole("button", { name: "offers", exact: true }).focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  assert(
    await page
      .getByRole("button", { name: "formulas", exact: true })
      .evaluate((element) => element === document.activeElement),
    "Formulas must be reachable after Comparisons in the main navigation",
  );
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  assert(
    await page
      .locator("#calculator-toggle")
      .evaluate((element) => element === document.activeElement),
    "The calculator visibility toggle must be reachable after the main navigation",
  );
  await page.keyboard.press("Tab");
  const records = page.getByRole("complementary", { name: "Saved records" });
  const recordFocus = await records.evaluate((element) => ({
    focused: element === document.activeElement,
    scrollable: element.scrollHeight > element.clientHeight,
    visible: getComputedStyle(element).outlineStyle !== "none",
  }));
  assert(!recordFocus.focused || (recordFocus.scrollable && recordFocus.visible));
  if (recordFocus.focused) {
    await page.keyboard.press("Tab");
  }
  assert(
    await page
      .getByRole("button", { name: "New offer", exact: true })
      .evaluate((element) => element === document.activeElement),
  );
  assert(
    await page.evaluate(
      () => getComputedStyle(document.activeElement ?? document.body).outlineStyle !== "none",
    ),
  );
  await page.keyboard.press("Enter");
}

export { accessibilityFlow, contrast, squareCorners };
