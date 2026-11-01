import { afterAll, beforeAll, expect, it } from "bun:test";
import process from "node:process";
import type { Server } from "bun";
import { requireFreePort } from "../../config/port.ts";
import { textField } from "../measurement/edit-flow.ts";
import { browsers } from "./browsers.ts";
import { formulasFlow } from "./formulas-flow.ts";
import { productionAssets } from "./production-flow.ts";

let server: Server<undefined>;
const workflowTimeout = 90_000;
const actionTimeout = 10_000;
const notFound = 404;
beforeAll(async () => {
  await requireFreePort();
  const assets = await productionAssets();
  server = Bun.serve({
    hostname: "127.0.0.1",
    port: 2000,
    development: false,
    fetch(request) {
      const asset = assets.get(new URL(request.url).pathname);
      if (asset === undefined) {
        return new Response("Not found", { status: notFound });
      }
      return new Response(asset);
    },
  });
});
afterAll(async () => {
  await server?.stop(true);
});
it.each(browsers)(
  "persists custom formulas in the static app: $name",
  async (entry) => {
    const browser = await entry.launch();
    try {
      const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
      const page = await context.newPage();
      page.setDefaultTimeout(actionTimeout);
      const errors: string[] = [];
      page.on("pageerror", (error) => {
        errors.push(error.message);
        process.stderr.write(`${error.stack}\n`);
      });
      page.on("console", (message) => {
        if (message.type() === "error") {
          process.stderr.write(`${message.text()}\n`);
        }
      });
      await page.goto(server.url.href);
      await formulasFlow(page, `test-results/formulas-${entry.name}`);
      await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
      await page.context().setOffline(true);
      await page.reload();
      expect(await page.getByLabel("Expression", { exact: true }).inputValue()).toContain("+ 5");
      await textField(page, "Expression", "[Base cash pay before tax] / 1000 + 6");
      const preview = page.getByRole("region", { name: "Formula preview", exact: true });
      expect(await preview.textContent()).toContain("$106.00");
      await page.reload();
      expect(await page.getByLabel("Expression", { exact: true }).inputValue()).toContain("+ 6");
      expect(errors).toEqual([]);
      process.stdout.write(`${entry.name} ${browser.version()} on ${process.platform}\n`);
    } finally {
      await browser.close();
    }
  },
  workflowTimeout,
);
