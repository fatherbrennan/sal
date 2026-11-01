import { afterAll, beforeAll, expect, it } from "bun:test";
import process from "node:process";
import type { Server } from "bun";
import { requireFreePort } from "../../config/port.ts";
import { baseSuperInspectorFlow } from "./base-super-inspector-flow.ts";
import { browsers } from "./browsers.ts";
import { comparisonInspectorFlow, metricTooltips } from "./comparison-inspector-flow.ts";
import { cellNavigationFlow, inspectorNavigationFlow } from "./inspector-navigation-flow.ts";
import { inspectorPreferencesFlow } from "./inspector-preferences-flow.ts";
import { productionAssets } from "./production-flow.ts";

let server: Server<undefined>;
const notFound = 404;
const timeout = 60_000;
const actionTimeout = 5000;
it.each(browsers)(
  "clicks comparison cells without intercepting their other controls: $name",
  async (entry) => {
    const browser = await entry.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
      page.setDefaultTimeout(actionTimeout);
      await page.goto(server.url.href);
      await cellNavigationFlow(page);
    } finally {
      await browser.close();
    }
  },
  timeout,
);
it.each(browsers)(
  "persists and transfers inspector preferences: $name",
  async (entry) => {
    const browser = await entry.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
      page.setDefaultTimeout(actionTimeout);
      await page.goto(server.url.href);
      await inspectorPreferencesFlow(page);
    } finally {
      await browser.close();
    }
  },
  timeout,
);
it.each(browsers)(
  "connects inspector navigation to comparison references: $name",
  async (entry) => {
    const browser = await entry.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
      page.setDefaultTimeout(actionTimeout);
      await page.goto(server.url.href);
      await inspectorNavigationFlow(page);
    } finally {
      await browser.close();
    }
  },
  timeout,
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
it.each(browsers)(
  "inspects real comparison amounts and differences: $name",
  async (entry) => {
    const browser = await entry.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
      page.setDefaultTimeout(actionTimeout);
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(server.url.href);
      await comparisonInspectorFlow(page, `test-results/comparison-inspector-${entry.name}`);
      await metricTooltips(page);
      expect(errors).toEqual([]);
      await Bun.write(
        `test-results/comparison-inspector-${entry.name}.json`,
        JSON.stringify({
          browser: entry.name,
          version: browser.version(),
          platform: process.platform,
          architecture: process.arch,
          headless: true,
        }),
      );
    } finally {
      await browser.close();
    }
  },
  timeout,
);

it.each(browsers)(
  "isolates base and bonus super in the inspector: $name",
  async (entry) => {
    const browser = await entry.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
      page.setDefaultTimeout(actionTimeout);
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(server.url.href);
      await baseSuperInspectorFlow(page);
      expect(errors).toEqual([]);
    } finally {
      await browser.close();
    }
  },
  timeout,
);
