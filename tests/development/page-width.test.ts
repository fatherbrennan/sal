import { expect, it } from "bun:test";
import process from "node:process";
import { browsers } from "../browser/browsers.ts";
import { pageWidthFlow } from "../browser/page-width-flow.ts";

const actionTimeout = 5000;
const workflowTimeout = 60_000;
it.each(browsers)(
  "previews and saves page width on the existing development server: $name",
  async (entry) => {
    const browser = await entry.launch();
    try {
      const page = await browser.newPage();
      page.setDefaultTimeout(actionTimeout);
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto("http://localhost:2000");
      const artifact = `test-results/page-width-dev-${entry.name}`;
      await pageWidthFlow(page, artifact);
      expect(errors).toEqual([]);
      await Bun.write(
        `${artifact}.json`,
        JSON.stringify({
          browser: entry.name,
          version: browser.version(),
          platform: process.platform,
          architecture: process.arch,
          mode: "development",
        }),
      );
    } finally {
      await browser.close();
    }
  },
  workflowTimeout,
);
