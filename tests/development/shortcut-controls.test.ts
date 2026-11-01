import { expect, it } from "bun:test";
import process from "node:process";
import { browsers } from "../browser/browsers.ts";
import { calculatorAudit } from "../browser/shortcut-audit-calculator.ts";
import { dialogAudit } from "../browser/shortcut-audit-dialogs.ts";
import { shortcutContextFlow } from "../browser/shortcut-context-flow.ts";
import { shortcutControlsFlow } from "../browser/shortcut-controls-flow.ts";

const timeout = 90_000;
const actionTimeout = 5000;
it.each(browsers)(
  "customises shortcuts by context: $name",
  async (entry) => {
    const browser = await entry.launch();
    try {
      const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
      const page = await context.newPage();
      page.setDefaultTimeout(actionTimeout);
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto("http://localhost:2000");
      const artifact = `test-results/shortcut-controls-${entry.name}`;
      await shortcutControlsFlow(page, artifact);
      await page.reload();
      await shortcutContextFlow(page);
      await calculatorAudit(page);
      await dialogAudit(page);
      expect(errors).toEqual([]);
      await Bun.write(
        `${artifact}.json`,
        JSON.stringify({
          browser: entry.name,
          version: browser.version(),
          platform: process.platform,
          architecture: process.arch,
          headless: true,
          server: "Existing server on port 2000",
        }),
      );
    } finally {
      await browser.close();
    }
  },
  timeout,
);
