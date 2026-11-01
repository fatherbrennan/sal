import { afterAll, beforeAll, expect, it } from "bun:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import process from "node:process";
import type { Page } from "playwright";
import { createServer, type ViteDevServer } from "vite";
import { browsers, browserTimeout } from "./browsers.ts";

let server: ViteDevServer | undefined;
const actionTimeout = 5000;
const alpha = /^Alpha /u;
const beta = /^Beta /u;
beforeAll(async () => {
  server = await createServer({
    configFile: resolve("vite.config.ts"),
    server: {
      host: "127.0.0.1",
      open: false,
      fs: { allow: [resolve(".")] },
    },
  });
  await server.listen();
});
afterAll(async () => {
  await server?.close();
});

async function multipleSelection(page: Page): Promise<void> {
  const multiple = page.getByRole("region", { name: "Multiple selection" });
  const search = multiple.getByRole("combobox");
  const options = multiple.getByRole("listbox");
  await search.focus();
  assert((await options.getAttribute("aria-multiselectable")) === "true");
  assert((await options.getByRole("option", { selected: true }).count()) === 1);
  await options.getByRole("option", { name: alpha, selected: true }).waitFor();
  await options.getByRole("option", { name: beta }).click();
  await options.getByRole("option", { name: beta, selected: true }).waitFor();
  assert((await options.getByRole("option", { selected: true }).count()) === 2);
  assert(await search.evaluate((element) => element === document.activeElement));
  assert((await search.getAttribute("aria-expanded")) === "true");
  await search.fill("Gamma");
  await search.press("ArrowDown");
  await search.press("Enter");
  await options.getByRole("option", { selected: true }).waitFor();
  assert((await search.inputValue()) === "Gamma");
  await search.press("Enter");
  await options.getByRole("option", { selected: false }).waitFor();
  await multiple.getByRole("button", { name: "Clear search", exact: true }).click();
  assert((await options.getByRole("option", { selected: true }).count()) === 2);
  await options.getByRole("option", { name: alpha }).click();
  await options.getByRole("option", { name: beta }).click();
  assert((await options.getByRole("option", { selected: true }).count()) === 0);
  await search.press("ArrowDown");
  await search.press("Enter");
  await options.getByRole("option", { selected: true }).waitFor();
  await search.press("Escape");
  assert((await search.getAttribute("aria-expanded")) === "false");
  await search.press("ArrowDown");
  assert((await options.getByRole("option", { selected: true }).count()) === 1);
  await search.fill("no match");
  await multiple.getByRole("status").waitFor();
  await search.press("Enter");
  await multiple.getByRole("button", { name: "Clear search", exact: true }).click();
  assert((await options.getByRole("option", { selected: true }).count()) === 1);
  await search.press("Tab");
  assert((await search.getAttribute("aria-expanded")) === "false");
}
async function singleSelection(page: Page): Promise<void> {
  const single = page.getByRole("region", { name: "Single selection" });
  const singleSearch = single.getByRole("combobox");
  await singleSearch.fill("Beta");
  assert((await single.getByRole("listbox").getAttribute("aria-multiselectable")) === null);
  await singleSearch.press("ArrowDown");
  await singleSearch.press("Enter");
  assert((await singleSearch.getAttribute("aria-expanded")) === "false");
  assert((await singleSearch.inputValue()) === "");
  await singleSearch.press("ArrowDown");
  assert((await single.getByRole("option", { selected: true }).count()) === 1);
  await single.getByRole("option", { name: beta, selected: true }).waitFor();
}
it.each(browsers)(
  "toggles multiple selections and preserves single selection: $name",
  async (entry) => {
    const browser = await entry.launch();
    try {
      const page = await browser.newPage();
      page.setDefaultTimeout(actionTimeout);
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto("http://127.0.0.1:2000");
      await page.addScriptTag({
        type: "module",
        url: "/tests/browser/fixtures/combobox/entry.svelte.ts",
      });
      await multipleSelection(page);
      await singleSelection(page);
      expect(errors).toEqual([]);
      await Bun.write(
        `test-results/combobox-${entry.name}.json`,
        JSON.stringify({
          browser: entry.name,
          version: browser.version(),
          platform: process.platform,
          architecture: process.arch,
        }),
      );
    } finally {
      await browser.close();
    }
  },
  browserTimeout,
);
