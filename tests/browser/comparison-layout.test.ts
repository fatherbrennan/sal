import { afterAll, beforeAll, expect, it } from "bun:test";
import process from "node:process";
import type { Server } from "bun";
import { requireFreePort } from "../../config/port.ts";
import { browsers } from "./browsers.ts";
import { comparisonLayoutFlow } from "./comparison-layout-flow.ts";
import { comparisonOffersFlow } from "./comparison-offers-flow.ts";
import { comparisonScenarioFlow } from "./comparison-scenario-flow.ts";
import { productionAssets } from "./production-flow.ts";
import { sharedLayoutFlow } from "./shared-layout-flow.ts";

let server: Server<undefined>;
const actionTimeout = 5000;
const workflowTimeout = 60_000;
const notFound = 404;
const cases = browsers.flatMap((entry) =>
  [
    { name: "desktop", width: 1280, height: 800 },
    { name: "mobile-viewport", width: 390, height: 844 },
    { name: "narrow-viewport", width: 320, height: 800 },
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
  "selects comparison offers with the multiselect combobox: $name",
  async (entry) => {
    const browser = await entry.launch();
    try {
      const page = await browser.newPage();
      page.setDefaultTimeout(actionTimeout);
      await page.goto(server.url.href);
      await comparisonOffersFlow(page, `test-results/comparison-offers-${entry.name}`);
    } finally {
      await browser.close();
    }
  },
  workflowTimeout,
);

it.each(browsers)(
  "selects one earnings scenario with the combobox: $name",
  async (entry) => {
    const browser = await entry.launch();
    try {
      const page = await browser.newPage();
      page.setDefaultTimeout(actionTimeout);
      await page.goto(server.url.href);
      await comparisonScenarioFlow(page, `test-results/comparison-scenario-${entry.name}`);
    } finally {
      await browser.close();
    }
  },
  workflowTimeout,
);

it.each(cases)(
  "keeps comparison scrolling in the page: %j",
  async ({ entry, viewport }) => {
    const browser = await entry.launch();
    try {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      const diagnostics: string[] = [];
      page.on("pageerror", (error) => diagnostics.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error" || message.type() === "warning") {
          diagnostics.push(message.text());
        }
      });
      page.setDefaultTimeout(actionTimeout);
      await page.goto(server.url.href);
      const artifact = `test-results/comparison-layout-${entry.name}-${viewport.name}`;
      await comparisonLayoutFlow(page, artifact);
      if (viewport.name === "desktop") {
        await sharedLayoutFlow(page, artifact);
      }
      expect(diagnostics).toEqual([]);
      await Bun.write(
        `${artifact}.json`,
        JSON.stringify({
          browser: entry.name,
          version: browser.version(),
          platform: process.platform,
          viewport,
        }),
      );
    } finally {
      await browser.close();
    }
  },
  workflowTimeout,
);
