import { afterAll, beforeAll, expect, it } from "bun:test";
import process from "node:process";
import type { Server } from "bun";
import { requireFreePort } from "../../config/port.ts";
import { importFixture } from "../measurement/compare-flow.ts";
import { browsers } from "./browsers.ts";
import { productionAssets } from "./production-flow.ts";
import {
  desktop,
  enlargedTypography,
  narrow,
  offlineFonts,
  typographyProblems,
  typographySurfaces,
} from "./typography-flow.ts";
import { typographyStress } from "./typography-stress-flow.ts";

let server: Server<undefined>;
const notFound = 404;
const timeout = 60_000;
const actionTimeout = 5000;

beforeAll(async () => {
  await requireFreePort();
  const assets = await productionAssets();
  server = Bun.serve({
    hostname: "127.0.0.1",
    port: 2000,
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
  "uses the shared typography throughout the static app: $name",
  async (entry) => {
    const browser = await entry.launch();
    try {
      const context = await browser.newContext({ viewport: desktop });
      const page = await context.newPage();
      page.setDefaultTimeout(actionTimeout);
      const external: string[] = [];
      page.on("request", (request) => {
        if (new URL(request.url()).origin !== server.url.origin) {
          external.push(request.url());
        }
      });
      await page.goto(server.url.href);
      await importFixture(page);
      await typographySurfaces(page, entry.name);
      await enlargedTypography(page, entry.name);
      await typographyStress(page, entry.name);
      const wrong = await page.addStyleTag({
        content: "body { font-family: serif; font-size: 10px; }",
      });
      expect((await typographyProblems(page)).length).toBeGreaterThan(0);
      await wrong.evaluate((element) => element.parentNode?.removeChild(element));
      const fonts = await offlineFonts(page);
      expect(fonts).toEqual([1, 1, 1, 1, 1, 1]);
      expect(external).toEqual([]);
      await Bun.write(
        `test-results/typography-${entry.name}.json`,
        JSON.stringify({
          browser: entry.name,
          version: browser.version(),
          platform: process.platform,
          architecture: process.arch,
          viewports: [desktop, narrow],
          themes: ["light", "dark"],
          fonts,
          offlineReload: true,
        }),
      );
    } finally {
      await browser.close();
    }
  },
  timeout,
);
