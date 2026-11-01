import { afterAll, beforeAll, expect, it } from "bun:test";
import process from "node:process";
import type { Server } from "bun";
import { requireFreePort } from "../../config/port.ts";
import { browsers } from "./browsers.ts";
import { pageWidthFlow } from "./page-width-flow.ts";
import { productionAssets } from "./production-flow.ts";
import { settingsFlow } from "./settings-flow.ts";
import { shortcutContextFlow } from "./shortcut-context-flow.ts";
import { shortcutControlsFlow } from "./shortcut-controls-flow.ts";
import { shortcutRemappingFlow } from "./shortcut-remapping-flow.ts";
import { uiStateFlow } from "./ui-state-flow.ts";

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
  "replaces every shortcut with singles and sequences: $name",
  async (entry) => {
    const browser = await entry.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
      page.setDefaultTimeout(actionTimeout);
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(server.url.href);
      await shortcutRemappingFlow(page, true);
      expect(errors).toEqual([]);
      await Bun.write(
        `test-results/shortcut-remapping-${entry.name}.json`,
        JSON.stringify({
          browser: entry.name,
          version: browser.version(),
          platform: process.platform,
          architecture: process.arch,
          headless: true,
          server: "Production assets",
          actions: 21,
          modes: ["single", "sequence"],
          offlineReload: true,
        }),
      );
    } finally {
      await browser.close();
    }
  },
  workflowTimeout,
);

it.each(browsers)(
  "customises shortcuts by context: $name",
  async (entry) => {
    const browser = await entry.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
      page.setDefaultTimeout(actionTimeout);
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(server.url.href);
      await shortcutControlsFlow(page, `test-results/shortcut-controls-built-${entry.name}`);
      expect(errors).toEqual([]);
    } finally {
      await browser.close();
    }
  },
  workflowTimeout,
);

it.each(browsers)(
  "restores local UI state without changing records: $name",
  async (entry) => {
    const browser = await entry.launch();
    try {
      const context = await browser.newContext();
      const page = await context.newPage();
      page.setDefaultTimeout(actionTimeout);
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(server.url.href);
      await uiStateFlow(page);
      expect(errors).toEqual([]);
    } finally {
      await browser.close();
    }
  },
  workflowTimeout,
);

it.each(browsers)(
  "previews and saves page width in a fixed dialog: $name",
  async (entry) => {
    const browser = await entry.launch();
    try {
      const page = await browser.newPage();
      page.setDefaultTimeout(actionTimeout);
      await page.goto(server.url.href);
      await pageWidthFlow(page, `test-results/page-width-${entry.name}`);
    } finally {
      await browser.close();
    }
  },
  workflowTimeout,
);

it.each(browsers)(
  "groups Settings and scopes keyboard actions: $name",
  async (entry) => {
    const browser = await entry.launch();
    try {
      const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
      const page = await context.newPage();
      page.setDefaultTimeout(actionTimeout);
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(server.url.href);
      const artifact = `test-results/settings-${entry.name}`;
      await settingsFlow(page, artifact);
      await shortcutContextFlow(page);
      expect(errors).toEqual([]);
      await Bun.write(
        `${artifact}.json`,
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
  workflowTimeout,
);
