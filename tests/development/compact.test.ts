import { expect, it } from "bun:test";
import { browsers } from "../browser/browsers.ts";
import { compactFlow } from "../browser/compact-flow.ts";

const actionTimeout = 5000;
const workflowTimeout = 90_000;

it.each(browsers)(
  "checks compact workflows headlessly: $name",
  async (entry) => {
    const browser = await entry.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
      page.setDefaultTimeout(actionTimeout);
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto("http://localhost:2000");
      await compactFlow(page, `test-results/compact-dev-${entry.name}`);
      expect(errors).toEqual([]);
    } finally {
      await browser.close();
    }
  },
  workflowTimeout,
);
