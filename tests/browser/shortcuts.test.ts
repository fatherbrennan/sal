import { afterAll, beforeAll, expect, it } from "bun:test";
import { resolve } from "node:path";
import process from "node:process";
import { createServer, type ViteDevServer } from "vite";
import { browsers } from "./browsers.ts";
import { calculatorFlow } from "./calculator-flow.ts";
import { settingsFlow, shortcutReferenceFlow } from "./settings-flow.ts";
import { calculatorAudit } from "./shortcut-audit-calculator.ts";
import { controlAudit } from "./shortcut-audit-controls.ts";
import { shortcutCoverage } from "./shortcut-audit-coverage.ts";
import { dialogAudit } from "./shortcut-audit-dialogs.ts";
import { shortcutAuditTable } from "./shortcut-audit-table.ts";
import { shortcutContextFlow } from "./shortcut-context-flow.ts";

const workflowTimeout = 180_000;
const actionTimeout = 5000;
let server: ViteDevServer | undefined;
beforeAll(async () => {
  server = await createServer({
    configFile: resolve("vite.config.ts"),
    server: { host: "127.0.0.1", open: false, fs: { allow: [resolve(".")] } },
  });
  await server.listen();
});
afterAll(async () => {
  await server?.close();
});
it.each(browsers)(
  "audits shortcut contexts, conditions and handler coverage: $name",
  async (entry) => {
    const browser = await entry.launch();
    try {
      const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
      const page = await context.newPage();
      page.setDefaultTimeout(actionTimeout);
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      if (entry.name === "Chrome") {
        await page.coverage.startJSCoverage({
          reportAnonymousScripts: false,
          resetOnNavigation: false,
        });
      }
      await page.goto("http://127.0.0.1:2000");
      const artifact = `test-results/shortcuts-audit-${entry.name}`;
      await settingsFlow(page, artifact);
      await shortcutReferenceFlow(page, artifact);
      await shortcutAuditTable(page);
      await shortcutContextFlow(page);
      await calculatorAudit(page);
      await dialogAudit(page);
      const calculator = page.getByRole("complementary", { name: "Quick calculator" });
      await calculator.getByRole("button", { name: "Clear", exact: true }).click();
      await calculator.getByRole("button", { name: "Calculator", exact: true }).click();
      await calculatorFlow(page, artifact);
      await page.locator("header").getByRole("button", { name: "Calculator", exact: true }).click();
      await controlAudit(page);
      expect(errors).toEqual([]);
      if (entry.name === "Chrome") {
        await shortcutCoverage(page, artifact);
      }
      await Bun.write(
        `${artifact}.json`,
        JSON.stringify({
          browser: entry.name,
          version: browser.version(),
          platform: process.platform,
          architecture: process.arch,
          headless: true,
          server: "Vite test server on port 2000",
          viewport: { width: 1280, height: 800 },
        }),
      );
    } finally {
      await browser.close();
    }
  },
  workflowTimeout,
);
