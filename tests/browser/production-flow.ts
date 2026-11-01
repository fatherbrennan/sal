import assert from "node:assert/strict";
import { join } from "node:path";
import type { Page } from "playwright";
import { comparisonDetailsFlow, importFixture } from "../measurement/compare-flow.ts";
import { expandComparison, saveSettled } from "../measurement/edit-flow.ts";
import {
  amountButton,
  closeInspector,
  followValue,
  formulaText,
} from "../measurement/inspector-flow.ts";
import { workPatternFlow } from "../measurement/work-pattern-flow.ts";
import { squareCorners } from "./accessibility-flow.ts";

const readinessTimeout = 5000;
async function productionAssets(): Promise<Map<string, Blob>> {
  if (!(await Bun.file("build/index.html").exists())) {
    throw new Error("Run the test:browser package task to build production assets first.");
  }
  // Freeze assets so a separate rebuild cannot mix new HTML with this run's asset paths.
  const assets = new Map<string, Blob>(
    await Promise.all(
      [...new Bun.Glob("**/*").scanSync({ cwd: "build", onlyFiles: true, dot: true })].map(
        async (path) => {
          const file = Bun.file(join("build", path));
          return [
            `/${path.replaceAll("\\", "/")}`,
            new Blob([await file.arrayBuffer()], { type: file.type }),
          ] as const;
        },
      ),
    ),
  );
  const entry = assets.get("/index.html");
  assert(entry !== undefined, "The static build changed while its assets were being captured.");
  const htmlSuffix = ".html";
  for (const [path, asset] of assets) {
    if (path.endsWith(htmlSuffix)) {
      assets.set(path.slice(0, -htmlSuffix.length), asset);
    }
  }
  assets.set("/", entry);
  return assets;
}
async function ready(page: Page): Promise<void> {
  await page
    .getByText("Offline assets ready. This app can reopen without internet.", { exact: true })
    .waitFor({ timeout: readinessTimeout, state: "attached" });
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
}
async function updateFlow(page: Page, changeBuild: () => void): Promise<void> {
  await ready(page);
  changeBuild();
  await page.locator("footer summary").click();
  await page.getByRole("button", { name: "Check for app update" }).click();
  const reload = page.getByRole("button", { name: "Reload saved app to update" });
  await reload.waitFor({ timeout: readinessTimeout });
  await page.locator("footer summary").click();
  assert(await reload.isVisible(), "An update stays visible when app status is collapsed");
  await page.getByRole("button", { name: "offers", exact: true }).click();
  await page.getByRole("button", { name: "Remote offer", exact: true }).click();
  const salary = page.getByLabel("Base salary or revenue (AUD)", { exact: true });
  await salary.fill("invalid");
  await salary.press("Tab");
  await reload.click();
  await page
    .getByText("Finish saving and correct invalid fields before reloading.", { exact: true })
    .waitFor();
  await salary.fill("123200");
  await salary.press("Tab");
  await saveSettled(page);
  await Promise.all([page.waitForEvent("load"), reload.click()]);
  await page.getByRole("button", { name: "Remote offer", exact: true }).click();
  assert((await salary.inputValue()) === "123200");
}
async function productionFlow(
  page: Page,
  url: string,
  changeBuild: () => void,
  artifact: string,
): Promise<void> {
  await importFixture(page);
  await updateFlow(page, changeBuild);
  await ready(page);
  const context = page.context();
  await context.setOffline(true);
  await page.reload({ waitUntil: "load" });
  await page.getByRole("button", { name: "Remote offer", exact: true }).click();
  assert(
    (await page.getByLabel("Base salary or revenue (AUD)", { exact: true }).inputValue()) ===
      "123200",
  );
  await page.locator("footer summary").click();
  await page.getByRole("button", { name: "Check for app update" }).click();
  await page
    .getByText("Cannot check for an update while offline. The installed app remains available.", {
      exact: true,
    })
    .waitFor();
  const reopened = await context.newPage();
  try {
    await reopened.goto(url);
    await reopened.getByRole("button", { name: "comparisons", exact: true }).click();
    await reopened
      .getByLabel("Saved comparison", { exact: true })
      .selectOption({ label: "Two offers" });
    assert(
      (await reopened.getByRole("region", { name: "Salary comparison" }).textContent())?.includes(
        "$84,280.00",
      ),
    );
    const right = reopened.getByRole("button", { name: "Scroll comparison right" });
    if (await right.isEnabled()) {
      await right.focus();
      await reopened.keyboard.press("Enter");
    }
    await reopened.waitForFunction(() => {
      const table = document.querySelector('[aria-label="Salary comparison"]');
      return table !== null && (table.scrollWidth <= table.clientWidth || table.scrollLeft > 0);
    });
    await reopened.evaluate(() => globalThis.scrollTo(0, 0));
    await squareCorners(reopened);
    await reopened.screenshot({
      path: `${artifact}-comparison.png`,
      fullPage: true,
    });
    await reopened.evaluate(() => document.documentElement.setAttribute("data-appearance", "dark"));
    await reopened.screenshot({
      path: `${artifact}-comparison-dark.png`,
      fullPage: true,
    });
    await offlineEquation(reopened);
  } finally {
    await reopened.close();
  }
}

async function productionComparisons(page: Page): Promise<void> {
  await importFixture(page);
  await page.getByRole("button", { name: "comparisons", exact: true }).click();
  await page.getByLabel("Saved comparison", { exact: true }).selectOption({ label: "Two offers" });
  await comparisonDetailsFlow(page);
}

async function offlineWorkPatterns(page: Page, artifact: string): Promise<void> {
  await importFixture(page);
  await ready(page);
  await page.context().setOffline(true);
  await page.reload({ waitUntil: "load" });
  await workPatternFlow(page, artifact);
}

async function offlineEquation(page: Page): Promise<void> {
  await expandComparison(page);
  await amountButton(page, "Package value before tax per standard paid hour").click();
  assert(
    (await formulaText(page.getByRole("dialog"))).includes(
      "annual_gross_package_value / standard_paid_hours_per_year",
    ),
  );
  const popup = page.getByRole("dialog");
  await followValue(popup, "annual_gross_package_value");
  await followValue(popup, "annual_remuneration");
  await popup.getByRole("button", { name: "Back one step", exact: true }).click();
  await popup
    .locator("[data-node-heading] code")
    .getByText("annual_gross_package_value", { exact: true })
    .waitFor();
  await closeInspector(page);
}

export { offlineWorkPatterns, productionAssets, productionComparisons, productionFlow };
