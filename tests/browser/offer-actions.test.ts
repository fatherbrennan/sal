import { afterAll, beforeAll, expect, it } from "bun:test";
import process from "node:process";
import type { Server } from "bun";
import { requireFreePort } from "../../config/port.ts";
import { browsers } from "./browsers.ts";
import { offerActionsFlow } from "./offer-actions-flow.ts";
import { productionAssets } from "./production-flow.ts";

let server: Server<undefined>;
const notFound = 404;
const actionTimeout = 5000;
const workflowTimeout = 60_000;
const cases = browsers.flatMap((entry) =>
  [
    { width: 1280, height: 800 },
    { width: 320, height: 800 },
  ].map((viewport) => ({ entry, viewport })),
);

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
it.each(cases)(
  "duplicates offers without changing the source: %j",
  async ({ entry, viewport }) => {
    const browser = await entry.launch();
    try {
      const page = await browser.newPage({ viewport });
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.setDefaultTimeout(actionTimeout);
      await page.goto(server.url.href);
      const artifact = `test-results/offer-actions-${entry.name}-${viewport.width}`;
      await offerActionsFlow(page, artifact);
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
