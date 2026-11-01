import assert from "node:assert/strict";
import type { Locator, Page } from "playwright";
import { amountButton, closeInspector } from "../measurement/inspector-flow.ts";
import { navigateTo } from "../measurement/navigation.ts";

const desktop = { width: 1440, height: 1000 };
const narrow = { width: 320, height: 800 };
const headline = "Package value after tax, commute costs and commute time value";
const mono = /IBM Plex Mono/u;

async function typographyProblems(page: Page): Promise<string[]> {
  return await page.evaluate(() => {
    const tolerance = 0.02;
    const sizes = { small: 13, body: 14, section: 16, page: 18, title: 22 };
    const labelLength = 60;
    return [...document.querySelectorAll("body *")]
      .filter(
        (element) =>
          element.checkVisibility() &&
          !element.closest('script, style, option, [aria-hidden="true"]'),
      )
      .filter((element) =>
        [...element.childNodes].some(
          (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
        ),
      )
      .flatMap((element) => {
        const style = getComputedStyle(element);
        const size = Number.parseFloat(style.fontSize);
        const label = `${element.tagName}: ${element.textContent?.trim().slice(0, labelLength)}`;
        const problems: string[] = [];
        const compactVariable = element.matches(".trail-step code, .input-label code");
        const variableSize = 12;
        if (
          !(
            (compactVariable && Math.abs(variableSize - size) < tolerance) ||
            Object.values(sizes).some((allowed) => Math.abs(allowed - size) < tolerance)
          )
        ) {
          problems.push(`${label}: size ${size}`);
        }
        if (
          !(
            style.fontFamily.startsWith('"IBM Plex Sans"') ||
            style.fontFamily.startsWith('"IBM Plex Mono"')
          )
        ) {
          problems.push(`${label}: family ${style.fontFamily}`);
        }
        if (!["400", "600", "700"].includes(style.fontWeight) || style.fontStyle !== "normal") {
          problems.push(`${label}: ${style.fontWeight} ${style.fontStyle}`);
        }
        return problems;
      });
  });
}

async function inspectSurface(page: Page, artifact: string): Promise<void> {
  await page.evaluate(() => document.fonts.ready);
  const problems = await typographyProblems(page);
  assert(problems.length === 0, problems.join("\n"));
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ path: `${artifact}.png` });
}

async function inspectorTypography(panel: Locator): Promise<void> {
  const roles = [
    [".panel-heading h2", "16px"],
    [".amount", "16px"],
    [".name", "14px"],
    [".selected-code", "13px"],
    [".body", "13px"],
    [".source-formula", "13px"],
  ];
  await Promise.all(
    roles.map(async ([selector, size]) => {
      assert(selector !== undefined && size !== undefined);
      const actual = await panel
        .locator(selector)
        .first()
        .evaluate((element) => getComputedStyle(element).fontSize);
      assert(actual === size, `${selector}: expected ${size}, received ${actual}`);
    }),
  );
  assert(
    (await panel
      .locator(".formula")
      .first()
      .evaluate((element) => getComputedStyle(element).lineHeight)) === "19.5px",
  );
}

async function comparisonTypography(page: Page, artifact: string): Promise<void> {
  await page.getByRole("button", { name: "comparisons", exact: true }).click();
  await page.getByLabel("Saved comparison", { exact: true }).selectOption({ label: "Two offers" });
  await page.getByRole("button", { name: "Expand all details", exact: true }).click();
  await inspectSurface(page, `${artifact}-comparison`);
  assert(
    (await page
      .locator(".key-result .delta-values .numeric")
      .first()
      .evaluate((element) => getComputedStyle(element).fontSize)) === "13px",
  );
  assert(
    mono.test(
      await page
        .locator("td[data-metric] .numeric")
        .first()
        .evaluate((element) => getComputedStyle(element).fontFamily),
    ),
  );
  await amountButton(page, headline).click();
  const panel = page.getByRole("dialog", { name: "Calculation inspector" });
  await panel.waitFor();
  await inspectSurface(page, `${artifact}-inspector`);
  await inspectorTypography(panel);
  assert(
    mono.test(
      await panel.locator(".amount").evaluate((element) => getComputedStyle(element).fontFamily),
    ),
  );
  assert(
    mono.test(
      await panel
        .locator(".source-formula")
        .first()
        .evaluate((element) => getComputedStyle(element).fontFamily),
    ),
  );
  await closeInspector(page);
}

async function typographySurfaces(page: Page, browser: string): Promise<void> {
  await (["light", "dark"] as const).reduce(async (previous, theme) => {
    await previous;
    await page.emulateMedia({ colorScheme: theme });
    await [desktop, narrow].reduce(async (prior, viewport) => {
      await prior;
      await page.setViewportSize(viewport);
      const artifact = `test-results/typography-${browser}-${theme}-${viewport.width}`;
      await comparisonTypography(page, artifact);
      await ["offers", "Personal tax settings", "vehicle", "Preferences", "Backups"].reduce(
        async (before, tab) => {
          await before;
          await navigateTo(page, tab);
          if (tab === "offers") {
            await page.getByRole("button", { name: "Remote offer", exact: true }).click();
          }
          await page.locator("main details").evaluateAll((details) => {
            for (const detail of details) {
              if (detail instanceof HTMLDetailsElement) {
                detail.open = true;
              }
            }
          });
          await inspectSurface(page, `${artifact}-${tab}`);
        },
        Promise.resolve(),
      );
    }, Promise.resolve());
  }, Promise.resolve());
}

async function offlineFonts(page: Page): Promise<number[]> {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) =>
        navigator.serviceWorker.addEventListener("controllerchange", () => resolve(), {
          once: true,
        }),
      );
    }
  });
  await page.context().setOffline(true);
  await page.reload();
  return await page.evaluate(
    async () =>
      await Promise.all(
        ["IBM Plex Sans", "IBM Plex Mono"].flatMap((family) =>
          ["400", "600", "700"].map(
            async (weight) => (await document.fonts.load(`${weight} 14px "${family}"`)).length,
          ),
        ),
      ),
  );
}

async function enlargedTypography(page: Page, browser: string): Promise<void> {
  await page.setViewportSize(narrow);
  await page.getByRole("button", { name: "offers", exact: true }).click();
  await page.getByRole("button", { name: "Remote offer", exact: true }).click();
  const spacing = await page.addStyleTag({
    content:
      ":root { font-size: 175%; } body * { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }",
  });
  await page.screenshot({ path: `test-results/typography-${browser}-enlarged-spacing.png` });
  const overflow = await page.evaluate(() =>
    [...document.querySelectorAll("body *")]
      .filter(
        (element) =>
          element.checkVisibility() &&
          element.getBoundingClientRect().right > innerWidth + 1 &&
          !element.closest("nav"),
      )
      .map(
        (element) =>
          `${element.tagName}.${element.className}: ${Math.round(element.getBoundingClientRect().right)}`,
      ),
  );
  assert(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    overflow.join("\n"),
  );
  const clipped = await page.locator("input").evaluateAll((inputs) =>
    inputs
      .filter(
        (input) =>
          input instanceof HTMLInputElement &&
          input.checkVisibility() &&
          ["text", "search"].includes(input.type),
      )
      .flatMap((input) => {
        const style = getComputedStyle(input);
        const contentHeight =
          input.clientHeight -
          Number.parseFloat(style.paddingTop) -
          Number.parseFloat(style.paddingBottom);
        if (contentHeight < Number.parseFloat(style.lineHeight) - 1) {
          return [input.getAttribute("aria-label") ?? input.id];
        }
        return [];
      }),
  );
  assert(clipped.length === 0, clipped.join(", "));
  await spacing.evaluate((element) => element.parentNode?.removeChild(element));
}

export {
  desktop,
  enlargedTypography,
  narrow,
  offlineFonts,
  typographyProblems,
  typographySurfaces,
};
