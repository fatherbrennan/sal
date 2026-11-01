import { expect, it } from "bun:test";
import process from "node:process";
import { browsers } from "../browser/browsers.ts";
import { inspectorPreferencesFlow } from "../browser/inspector-preferences-flow.ts";
import { uiStateFlow } from "../browser/ui-state-flow.ts";

const actionTimeout = 5000;
const workflowTimeout = 60_000;
it.each(browsers)(
  "restores local UI state on the development server: $name",
  async (entry) => {
    const browser = await entry.launch();
    try {
      const context = await browser.newContext();
      const page = await context.newPage();
      page.setDefaultTimeout(actionTimeout);
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto("http://localhost:2000");
      await uiStateFlow(page);
      expect(errors).toEqual([]);
      await Bun.write(
        `test-results/ui-state-dev-${entry.name}.json`,
        JSON.stringify({
          browser: entry.name,
          version: browser.version(),
          platform: process.platform,
          architecture: process.arch,
        }),
      );
    } finally {
      await browser.close();
    }
  },
  workflowTimeout,
);

it.each(browsers)(
  "restores inspector visibility and pin preferences on the development server: $name",
  async (entry) => {
    const browser = await entry.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
      page.setDefaultTimeout(actionTimeout);
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto("http://localhost:2000");
      await inspectorPreferencesFlow(page);
      expect(errors).toEqual([]);
    } finally {
      await browser.close();
    }
  },
  workflowTimeout,
);
