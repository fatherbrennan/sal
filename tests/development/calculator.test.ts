import { expect, it } from "bun:test";
import process from "node:process";
import { browsers } from "../browser/browsers.ts";
import { calculatorFlow } from "../browser/calculator-flow.ts";
import { calculatorPlacementFlow } from "../browser/calculator-placement-flow.ts";

const actionTimeout = 5000;
const workflowTimeout = 60_000;
it.each(browsers)(
  "checks the calculator on the development server: $name",
  async (entry) => {
    const browser = await entry.launch();
    try {
      const viewport = { width: 1280, height: 800 };
      const page = await browser.newPage({ viewport });
      page.setDefaultTimeout(actionTimeout);
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto("http://localhost:2000");
      const artifact = `test-results/calculator-dev-${entry.name}`;
      await calculatorFlow(page, artifact);
      await calculatorPlacementFlow(page, artifact);
      expect(errors).toEqual([]);
      await Bun.write(
        `${artifact}.json`,
        JSON.stringify({
          browser: entry.name,
          version: browser.version(),
          platform: process.platform,
          architecture: process.arch,
          viewport,
        }),
      );
    } finally {
      await browser.close();
    }
  },
  workflowTimeout,
);
