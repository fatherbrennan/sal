import { expect, it } from "bun:test";
import process from "node:process";
import type { Page } from "playwright";
import { browsers } from "../browser/browsers.ts";
import { comparisonInspectorFlow } from "../browser/comparison-inspector-flow.ts";
import { comparisonLayoutFlow } from "../browser/comparison-layout-flow.ts";
import { comparisonOffersFlow } from "../browser/comparison-offers-flow.ts";
import { comparisonScenarioFlow } from "../browser/comparison-scenario-flow.ts";
import {
  cellNavigationFlow,
  inspectorNavigationFlow,
} from "../browser/inspector-navigation-flow.ts";
import { inspectorRefinementFlow } from "../browser/inspector-refinement-flow.ts";
import { offerActionsFlow } from "../browser/offer-actions-flow.ts";
import { enlargedTypography, typographySurfaces } from "../browser/typography-flow.ts";
import { typographyStress } from "../browser/typography-stress-flow.ts";
import { annualLeaveFlow } from "../measurement/annual-leave-flow.ts";
import { comparisonDetailsFlow, importFixture } from "../measurement/compare-flow.ts";
import { uxFlow } from "../measurement/ux-flow.ts";

const actionTimeout = 5000;
const workflowTimeout = 90_000;
const flows = [
  {
    name: "comparison layout",
    run: async (page: Page, artifact: string) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await comparisonLayoutFlow(page, artifact);
    },
  },
  { name: "comparison inspector", run: comparisonInspectorFlow },
  { name: "offer selection", run: comparisonOffersFlow },
  { name: "scenario selection", run: comparisonScenarioFlow },
  { name: "cell controls", run: cellNavigationFlow },
  { name: "inspector navigation", run: inspectorNavigationFlow },
  { name: "inspector refinements", run: inspectorRefinementFlow },
  { name: "offer actions", run: offerActionsFlow },
  { name: "editing and repair", run: uxFlow },
  { name: "annual leave", run: annualLeaveFlow },
  {
    name: "comparison values",
    run: async (page: Page) => {
      await importFixture(page);
      await page.getByRole("button", { name: "comparisons", exact: true }).click();
      await page.getByLabel("Saved comparison", { exact: true }).selectOption("compare-a");
      await comparisonDetailsFlow(page);
    },
  },
  {
    name: "typography",
    run: async (page: Page, artifact: string) => {
      await importFixture(page);
      await typographySurfaces(page, artifact);
      await enlargedTypography(page, artifact);
      await typographyStress(page, artifact);
    },
  },
];
const cases = browsers.flatMap((browser) => flows.map((flow) => ({ browser, flow })));
it.each(cases)(
  "reviews $flow.name headlessly in $browser.name",
  async ({ browser: entry, flow }) => {
    const browser = await entry.launch();
    try {
      const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
      const page = await context.newPage();
      page.setDefaultTimeout(actionTimeout);
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto("http://localhost:2000");
      await flow.run(page, `test-results/review-dev-${entry.name}-${flow.name}`);
      expect(errors).toEqual([]);
      await Bun.write(
        `test-results/review-dev-${entry.name}-${flow.name}.json`,
        JSON.stringify({
          browser: entry.name,
          version: browser.version(),
          platform: process.platform,
          architecture: process.arch,
          runtime: Bun.version,
          headless: true,
        }),
      );
    } finally {
      await browser.close();
    }
  },
  workflowTimeout,
);
