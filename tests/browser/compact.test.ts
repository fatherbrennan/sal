import { afterAll, beforeAll, expect, it } from "bun:test";
import type { Server } from "bun";
import { requireFreePort } from "../../config/port.ts";
import { browsers } from "./browsers.ts";
import { compactFlow } from "./compact-flow.ts";
import { productionAssets } from "./production-flow.ts";

let server: Server<undefined>;
const notFound = 404;
const actionTimeout = 5000;
const workflowTimeout = 90_000;
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
  "verifies compact workflows in the production build: $name",
  async (entry) => {
    const browser = await entry.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
      page.setDefaultTimeout(actionTimeout);
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(server.url.href);
      await compactFlow(page, `test-results/compact-${entry.name}`);
      expect(errors).toEqual([]);
    } finally {
      await browser.close();
    }
  },
  workflowTimeout,
);
