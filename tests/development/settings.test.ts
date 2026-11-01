import { expect, it } from "bun:test";
import process from "node:process";
import { browsers } from "../browser/browsers.ts";
import { calculatorFlow } from "../browser/calculator-flow.ts";
import { settingsFlow } from "../browser/settings-flow.ts";
import { shortcutContextFlow } from "../browser/shortcut-context-flow.ts";

const actionTimeout = 5000;
const workflowTimeout = 90_000;
it.each(browsers)(
  "verifies Settings on the existing development server: $name",
  async (entry) => {
    const browser = await entry.launch();
    try {
      const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
      const page = await context.newPage();
      page.setDefaultTimeout(actionTimeout);
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto("http://localhost:2000");
      const artifact = `test-results/settings-dev-${entry.name}`;
      await settingsFlow(page, artifact);
      await shortcutContextFlow(page);
      await page.reload();
      await calculatorFlow(page, artifact);
      expect(errors).toEqual([]);
      await Bun.write(
        `${artifact}.json`,
        JSON.stringify({
          browser: entry.name,
          version: browser.version(),
          platform: process.platform,
          architecture: process.arch,
          headless: true,
          mode: "existing development server",
        }),
      );
    } finally {
      await browser.close();
    }
  },
  workflowTimeout,
);
