import { expect, it } from "bun:test";
import process from "node:process";
import type { Page } from "playwright";
import { hostingBase, hostingUrl } from "../../config/github-pages.ts";
import { requireFreePort } from "../../config/port.ts";
import { browsers } from "../browser/browsers.ts";
import { productionAssets, productionFlow } from "../browser/production-flow.ts";

const httpError = 400;
const workflowTimeout = 60_000;

function watchRequests(page: Page, origin: string, base: string): string[] {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= httpError) {
      errors.push(`${response.status()} ${response.url()}`);
    }
  });
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.origin !== origin || !url.pathname.startsWith(`${base}/`)) {
      errors.push(`Request outside deployment: ${request.url()}`);
    }
  });
  return errors;
}

it.each(browsers)(
  "loads, saves, updates and reopens offline under the Pages path: $name",
  async (entry) => {
    await requireFreePort();
    const assets = await productionAssets();
    const base = hostingBase(hostingUrl);
    let revision = 0;
    const server = Bun.serve({
      hostname: "127.0.0.1",
      port: 2000,
      development: false,
      async fetch(request) {
        const path = new URL(request.url).pathname;
        let asset: Blob | undefined;
        if (path.startsWith(`${base}/`)) {
          asset = assets.get(path.slice(base.length));
        }
        if (asset === undefined) {
          return new Response("Not found", { status: 404 });
        }
        if (path === `${base}/service-worker.js`) {
          return new Response(`${await asset.text()}\n// Test revision ${revision}`, {
            headers: { "Content-Type": "text/javascript" },
          });
        }
        return new Response(asset);
      },
    });
    try {
      const browser = await entry.launch();
      try {
        const context = await browser.newContext();
        const page = await context.newPage();
        const errors = watchRequests(page, server.url.origin, base);
        const url = `${server.url.origin}${base}/`;
        await page.goto(url);
        await page.getByRole("heading", { name: "sal", exact: true }).waitFor();
        await productionFlow(
          page,
          url,
          () => {
            revision += 1;
          },
          `test-results/pages-${entry.name}`,
        );
        expect(errors).toEqual([]);
        await Bun.write(
          `test-results/pages-${entry.name}.json`,
          JSON.stringify({
            browser: entry.name,
            version: browser.version(),
            platform: process.platform,
            runtime: Bun.version,
            url,
            errors,
          }),
        );
      } finally {
        await browser.close();
      }
    } finally {
      await server.stop(true);
    }
  },
  workflowTimeout,
);
