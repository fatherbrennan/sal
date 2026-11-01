import { afterAll, beforeAll, expect, it } from "bun:test";
import process from "node:process";
import type { Server } from "bun";
import { requireFreePort } from "../../config/port.ts";
import { annualLeaveFlow } from "../measurement/annual-leave-flow.ts";
import { bonusSuperFlow } from "../measurement/bonus-super-flow.ts";
import { importFixture } from "../measurement/compare-flow.ts";
import { comparisonColors } from "../measurement/comparison-colors.ts";
import { comparisonEquations, equationFlow } from "../measurement/equation-flow.ts";
import { orderFlow } from "../measurement/order-flow.ts";
import { uxFlow } from "../measurement/ux-flow.ts";
import { accessibilityFlow } from "./accessibility-flow.ts";
import { browsers, browserTimeout } from "./browsers.ts";
import { fieldLayoutFlow } from "./field-layout-flow.ts";
import {
  offlineWorkPatterns,
  productionAssets,
  productionComparisons,
  productionFlow,
} from "./production-flow.ts";

let server: Server<undefined>;
const viewports = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "mobile-viewport", width: 390, height: 844 },
];
const notFound = 404;
const actionTimeout = 5000;
const workflowTimeout = 60_000;
let workerRevision = 0;

beforeAll(async () => {
  await requireFreePort();
  const assets = await productionAssets();
  server = Bun.serve({
    hostname: "127.0.0.1",
    port: 2000,
    development: false,
    async fetch(request) {
      const asset = assets.get(new URL(request.url).pathname);
      if (asset === undefined) {
        return new Response("Not found", { status: notFound });
      }
      if (new URL(request.url).pathname === "/service-worker.js") {
        return new Response(`${await asset.text()}\n// Test build ${workerRevision}`, {
          headers: { "Content-Type": "text/javascript" },
        });
      }
      return new Response(asset);
    },
  });
});

afterAll(async () => {
  await server?.stop(true);
});

const cases = browsers.flatMap((entry) => viewports.map((viewport) => ({ entry, viewport })));
const productionCases = cases.flatMap((entry) =>
  (["comparison", "offline", "work-pattern"] as const).map((workflow) => ({ ...entry, workflow })),
);
const layoutCases = browsers.flatMap((entry) =>
  [...viewports, { name: "narrow-viewport", width: 320, height: 800 }].map((viewport) => ({
    entry,
    viewport,
  })),
);
const equationCases = layoutCases.flatMap((entry) =>
  [false, true].map((metricSweep) => ({ ...entry, metricSweep })),
);

it.each(cases)(
  "separates base pay and paid annual leave in production: %j",
  async ({ entry, viewport }) => {
    const browser = await entry.launch();
    try {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      page.setDefaultTimeout(actionTimeout);
      await page.goto(server.url.href);
      await annualLeaveFlow(
        page,
        `test-results/leave-${entry.name.toLowerCase()}-${viewport.name}`,
      );
      await Bun.write(
        `test-results/leave-${entry.name.toLowerCase()}-${viewport.name}.json`,
        JSON.stringify({
          browser: entry.name,
          version: browser.version(),
          platform: process.platform,
          runtime: Bun.version,
          viewport,
        }),
      );
    } finally {
      await browser.close();
    }
  },
  browserTimeout,
);

it.each(cases)(
  "guides salary decisions and missing inputs: %j",
  async ({ entry, viewport }) => {
    const browser = await entry.launch();
    try {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      page.setDefaultTimeout(actionTimeout);
      await page.goto(server.url.href);
      await uxFlow(page, `test-results/ux-${entry.name.toLowerCase()}-${viewport.name}`);
      await Bun.write(
        `test-results/ux-${entry.name.toLowerCase()}-${viewport.name}.json`,
        JSON.stringify({
          browser: entry.name,
          version: browser.version(),
          platform: process.platform,
          runtime: Bun.version,
          viewport,
        }),
      );
    } finally {
      await browser.close();
    }
  },
  browserTimeout,
);

it.each(equationCases)(
  "explains calculations with clickable equations: %j",
  async ({ entry, viewport, metricSweep }) => {
    const browser = await entry.launch();
    try {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      page.setDefaultTimeout(actionTimeout);
      await page.goto(server.url.href);
      await importFixture(page);
      await page.getByRole("button", { name: "comparisons", exact: true }).click();
      await page
        .getByLabel("Saved comparison", { exact: true })
        .selectOption({ label: "Two offers" });
      let artifact = `test-results/equations-${entry.name.toLowerCase()}-${viewport.name}`;
      if (metricSweep) {
        artifact += "-metrics";
        await comparisonEquations(page);
      } else {
        await equationFlow(page, artifact);
        await comparisonColors(page);
      }
      await Bun.write(
        `${artifact}.json`,
        `${JSON.stringify({ browser: entry.name, version: browser.version(), platform: process.platform, runtime: Bun.version, viewport, headless: true })}\n`,
      );
    } finally {
      await browser.close();
    }
  },
  workflowTimeout,
);

it.each(cases)(
  "preserves explicit comparison order and alphabetical offers: %j",
  async ({ entry, viewport }) => {
    const browser = await entry.launch();
    try {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      page.setDefaultTimeout(actionTimeout);
      await page.goto(server.url.href);
      await orderFlow(page);
      await page.screenshot({
        path: `test-results/order-${entry.name.toLowerCase()}-${viewport.name}.png`,
        fullPage: true,
      });
    } finally {
      await browser.close();
    }
  },
  browserTimeout,
);

it.each(cases)(
  "saves bonus super choices in the static build: %j",
  async ({ entry, viewport }) => {
    const browser = await entry.launch();
    try {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      page.setDefaultTimeout(actionTimeout);
      await page.goto(server.url.href);
      await bonusSuperFlow(page);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await page.screenshot({
        path: `test-results/bonus-super-${entry.name.toLowerCase()}-${viewport.name}.png`,
        fullPage: true,
      });
      await Bun.write(
        `test-results/bonus-super-${entry.name.toLowerCase()}-${viewport.name}.json`,
        `${JSON.stringify({ browser: entry.name, version: browser.version(), platform: process.platform, runtime: Bun.version, viewport, headless: true })}\n`,
      );
    } finally {
      await browser.close();
    }
  },
  browserTimeout,
);

it.each(layoutCases)(
  "aligns fields and wrapped choices: %j",
  async ({ entry, viewport }) => {
    const browser = await entry.launch();
    try {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      page.setDefaultTimeout(actionTimeout);
      await page.goto(server.url.href);
      await fieldLayoutFlow(
        page,
        `test-results/layout-${entry.name.toLowerCase()}-${viewport.name}`,
      );
    } finally {
      await browser.close();
    }
  },
  browserTimeout,
);

it.each(productionCases)(
  "serves the static build: %j",
  async ({ entry, viewport, workflow }) => {
    const browser = await entry.launch();
    try {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      const diagnostics: string[] = [];
      page.setDefaultTimeout(actionTimeout);
      page.on("pageerror", (error) => diagnostics.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error" || message.type() === "warning") {
          diagnostics.push(`${message.location().url}: ${message.text()}`);
        }
      });
      page.on("requestfailed", (request) => diagnostics.push(`Failed: ${request.url()}`));
      page.on("request", (request) => {
        if (new URL(request.url()).origin !== server.url.origin) {
          diagnostics.push(`External request: ${request.url()}`);
        }
      });
      await page.goto(server.url.href, { waitUntil: "load" });
      await page.getByRole("heading", { name: "sal", exact: true }).waitFor();
      expect(await page.title()).toBe("sal");
      expect(await page.locator("html").getAttribute("lang")).toBe("en-AU");
      let artifact = `test-results/static-${entry.name.toLowerCase()}-${viewport.name}`;
      if (workflow !== "offline") {
        artifact += `-${workflow}`;
      }
      if (workflow === "comparison") {
        await productionComparisons(page);
      } else if (workflow === "work-pattern") {
        await offlineWorkPatterns(page, artifact);
      } else {
        await productionFlow(
          page,
          server.url.href,
          () => {
            workerRevision += 1;
          },
          artifact,
        );
      }
      await accessibilityFlow(page);
      expect(await page.getByRole("main").count()).toBe(1);
      expect(diagnostics).toEqual([]);
      await page.screenshot({ path: `${artifact}.png`, fullPage: true });
      await Bun.write(
        `${artifact}.json`,
        `${JSON.stringify(
          {
            browser: entry.name,
            version: browser.version(),
            platform: process.platform,
            runtime: Bun.version,
            viewport,
            headless: true,
            diagnostics,
          },
          null,
          2,
        )}\n`,
      );
    } finally {
      await browser.close();
    }
  },
  workflowTimeout,
);
