import { expect, it } from "bun:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { type Browser, chromium } from "playwright";
import { createServer } from "vite";
import { browserLcov, convertBrowserCoverage } from "../../scripts/browser-coverage.ts";
import { enforceCoverage } from "../../scripts/coverage.ts";
import { browserTimeout } from "./browsers.ts";

const rejectedWrite = /Status: ReadOnlyError/u;
const componentHandlerLine = 17;
const storageHandlerLine = 5;
const measuredFiles = [
  [
    "counter-fixture.svelte",
    "src/lib/components/counter-fixture.svelte",
    "rejectWrite",
    componentHandlerLine,
  ],
  ["storage.ts", "src/lib/data/storage.ts", "describeFailure", storageHandlerLine],
] as const;

async function measurePage(browser: Browser, origin: string, complete: boolean) {
  const page = await browser.newPage();
  try {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.coverage.startJSCoverage({ reportAnonymousScripts: false, resetOnNavigation: true });
    await page.goto(origin, { waitUntil: "load" });
    await page.addScriptTag({
      type: "module",
      url: `${origin}/tests/browser/fixtures/measurement/entry.ts`,
    });
    await page.getByRole("button", { name: "Increment", exact: true }).click();
    await page.getByText("Count: 1", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Queue write", exact: true }).click();
    await page.getByText("Status: queued", { exact: true }).waitFor();
    if (complete) {
      await page.getByRole("button", { name: "Reject write", exact: true }).click();
      await page.getByText(rejectedWrite).waitFor();
    }
    return { entries: await page.coverage.stopJSCoverage(), errors };
  } finally {
    await page.close();
  }
}

async function measureFixture(complete: boolean) {
  const server = await createServer({
    configFile: resolve("vite.config.ts"),
    server: {
      host: "127.0.0.1",
      open: false,
      fs: { allow: [resolve("tests/browser/fixtures/measurement")] },
    },
  });
  try {
    await server.listen();
    const address = server.httpServer?.address();
    assert(address !== null && typeof address === "object");
    const browser = await chromium.launch({ channel: "chrome", headless: true });
    try {
      return await measurePage(browser, `http://127.0.0.1:${address.port}`, complete);
    } finally {
      await browser.close();
    }
  } finally {
    await server.close();
  }
}

async function convertFixture(
  entries: Awaited<ReturnType<typeof measureFixture>>["entries"],
  fixture: (typeof measuredFiles)[number],
) {
  const [filename, target, expectedFunction, expectedLine] = fixture;
  const entry = entries.find(
    (candidate) =>
      new URL(candidate.url).pathname === `/tests/browser/fixtures/measurement/${filename}`,
  );
  assert(entry?.source !== undefined, `Missing source for ${filename}`);
  const path = resolve(`tests/browser/fixtures/measurement/${filename}`);
  const coverage = await convertBrowserCoverage(entry, path, await Bun.file(path).text());
  const named = Object.entries(coverage.functions).find(([location]) =>
    location.startsWith(`${expectedFunction}:${expectedLine}:`),
  );
  assert(named, `Missing authored function ${expectedFunction}`);
  return { lcov: browserLcov([{ ...coverage, path: target }]), target, count: named[1] };
}

// Independent expectations: a real readonly transaction throws, and omitted
// handlers remain uncovered at their authored source lines.
it(
  "rejects missed Svelte and IndexedDB failure handlers",
  async () => {
    const { entries, errors } = await measureFixture(false);
    expect(errors).toEqual([]);
    const results = await Promise.all(
      measuredFiles.map((fixture) => convertFixture(entries, fixture)),
    );
    for (const { lcov, target, count } of results) {
      expect(count).toBe(0);
      expect(() => enforceCoverage(lcov, [target])).toThrow();
    }
  },
  browserTimeout,
);

it(
  "accepts exercised Svelte and IndexedDB failure handlers",
  async () => {
    const { entries, errors } = await measureFixture(true);
    expect(errors).toEqual([]);
    const results = await Promise.all(
      measuredFiles.map((fixture) => convertFixture(entries, fixture)),
    );
    for (const { lcov, target, count } of results) {
      expect(count).toBe(1);
      expect(() => enforceCoverage(lcov, [target])).not.toThrow();
    }
  },
  browserTimeout,
);
