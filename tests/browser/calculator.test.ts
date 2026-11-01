import { afterAll, beforeAll, expect, it } from "bun:test";
import process from "node:process";
import type { Server } from "bun";
import { requireFreePort } from "../../config/port.ts";
import { browsers } from "./browsers.ts";
import { calculatorFlow } from "./calculator-flow.ts";
import { calculatorOfflineFlow, calculatorPlacementFlow } from "./calculator-placement-flow.ts";
import { productionAssets } from "./production-flow.ts";

let server: Server<undefined>;
const notFound = 404;
const actionTimeout = 5000;
const workflowTimeout = 60_000;
beforeAll(async () => {
  await requireFreePort();
  const assets = await productionAssets();
  server = Bun.serve({
    hostname: "127.0.0.1",
    port: 2000,
    development: false,
    fetch(request) {
      const asset = assets.get(new URL(request.url).pathname);
      if (!asset) {
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
  "calculates from desktop values and protects normal interactions: $name",
  async (entry) => {
    const browser = await entry.launch();
    try {
      const viewport = { width: 1280, height: 800 };
      const page = await browser.newPage({ viewport });
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.setDefaultTimeout(actionTimeout);
      await page.goto(server.url.href);
      const artifact = `test-results/calculator-${entry.name}`;
      await calculatorFlow(page, artifact);
      await calculatorPlacementFlow(page, artifact);
      await calculatorOfflineFlow(page);
      expect(errors).toEqual([]);
      await Bun.write(
        `${artifact}.json`,
        JSON.stringify({
          browser: entry.name,
          version: browser.version(),
          platform: process.platform,
          architecture: process.arch,
          viewport,
          headless: true,
        }),
      );
    } finally {
      await browser.close();
    }
  },
  workflowTimeout,
);
