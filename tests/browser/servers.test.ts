import { expect, it } from "bun:test";
import process from "node:process";
import { stripVTControlCharacters } from "node:util";
import type { Browser } from "playwright";
import { chromium } from "playwright";
import { importFixture } from "../measurement/compare-flow.ts";
import { amountButton } from "../measurement/inspector-flow.ts";
import { browsers } from "./browsers.ts";

const timeout = 30_000;
const processTimeout = 20_000;
const actionTimeout = 5000;
const successStatus = 200;
const localAddress = /http:\/\/(?:127\.0\.0\.1|localhost):2000\//u;

function launchVite(task: string, arguments_: string[] = []) {
  const host: string[] = [];
  let entry = "scripts/vite.ts";
  if (task !== "build") {
    entry = "node_modules/vite/bin/vite.js";
    host.push("--host", "127.0.0.1");
  }
  return Bun.spawn([process.execPath, "--bun", entry, task, ...host, ...arguments_], {
    stdout: "pipe",
    stderr: "pipe",
    timeout: processTimeout,
  });
}

async function readAddress(stream: ReadableStream<Uint8Array>): Promise<string> {
  const decoder = new TextDecoder();
  let output = "";
  for await (const chunk of stream.values({ preventCancel: true })) {
    output += decoder.decode(chunk, { stream: true });
    const match = stripVTControlCharacters(output).match(localAddress);
    if (match) {
      return match[0];
    }
  }
  throw new Error(`Vite server exited before readiness: ${output}`);
}

it.each([
  { task: "dev", expectedWebsocketPorts: ["2000"] },
  { task: "preview", expectedWebsocketPorts: [] },
])(
  "%j loads the application through the actual Bun/Vite CLI",
  async ({ task, expectedWebsocketPorts }) => {
    const child = launchVite(task);
    const errors = new Response(child.stderr).text();
    let browser: Browser | undefined;
    try {
      browser = await chromium.launch({ channel: "chrome" });
      const url = await readAddress(child.stdout);
      expect(url).toBe("http://127.0.0.1:2000/");
      const page = await browser.newPage();
      page.setDefaultTimeout(actionTimeout);
      page.setDefaultNavigationTimeout(processTimeout);
      const diagnostics: string[] = [];
      const websocketPorts: string[] = [];
      page.on("websocket", (socket) => websocketPorts.push(new URL(socket.url()).port));
      page.on("pageerror", (error) => diagnostics.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error" || message.type() === "warning") {
          diagnostics.push(message.text());
        }
      });
      const response = await page.goto(url, { waitUntil: "load" });
      expect(response?.status()).toBe(successStatus);
      await page.getByRole("heading", { name: "sal", exact: true }).waitFor();
      expect(await page.title()).toBe("sal");
      expect(diagnostics).toEqual([]);
      expect<readonly string[]>(websocketPorts).toEqual(expectedWebsocketPorts);
      await Bun.write(
        `test-results/server-${task}.json`,
        `${JSON.stringify({ task, url, websocketPorts, browser: "Chrome", version: browser.version(), platform: process.platform, runtime: Bun.version })}\n`,
      );
    } finally {
      try {
        await browser?.close();
      } finally {
        child.kill();
        await child.exited;
      }
    }
    expect(await errors).toBe("");
  },
  timeout,
);

it.each(
  ["dev", "preview", "build"].flatMap((task) =>
    ["127.0.0.1", "::1"].map((host) => ({ task, host })),
  ),
)(
  "%j fails without disturbing the server or build already on port 2000",
  async ({ task, host }) => {
    const entry = Bun.file("build/index.html");
    const modified = entry.lastModified;
    const occupant = Bun.serve({
      hostname: host,
      port: 2000,
      fetch: () => new Response("Existing server"),
    });
    try {
      const child = launchVite(task);
      const [code, output, errors] = await Promise.all([
        child.exited,
        new Response(child.stdout).text(),
        new Response(child.stderr).text(),
      ]);
      expect(code).not.toBe(0);
      expect(child.signalCode).toBeNull();
      expect(errors).toContain("Port 2000 is already in use");
      expect(stripVTControlCharacters(output)).not.toMatch(localAddress);
      expect(await (await fetch(occupant.url)).text()).toBe("Existing server");
      expect(Bun.file("build/index.html").lastModified).toBe(modified);
    } finally {
      await occupant.stop(true);
    }
  },
  timeout,
);

it(
  "preview caches the comparison inspector for offline reload without the removed lab",
  async () => {
    const child = launchVite("preview");
    const errors = new Response(child.stderr).text();
    let browser: Browser | undefined;
    try {
      const url = await readAddress(child.stdout);
      const removed = await fetch(new URL("inspector-lab", url));
      const notFound = 404;
      expect(removed.status).toBe(notFound);
      expect(await Bun.file("build/inspector-lab.html").exists()).toBe(false);
      browser = await chromium.launch({ channel: "chrome" });
      const page = await browser.newPage();
      page.setDefaultTimeout(actionTimeout);
      await page.goto(url);
      await importFixture(page);
      await page
        .getByText("Offline assets ready. This app can reopen without internet.", {
          exact: true,
        })
        .waitFor({ state: "attached" });
      await page.context().setOffline(true);
      await page.reload();
      await page.getByRole("button", { name: "comparisons", exact: true }).click();
      await page
        .getByLabel("Saved comparison", { exact: true })
        .selectOption({ label: "Two offers" });
      await amountButton(
        page,
        "Package value after tax, commute costs and commute time value",
      ).click();
      expect(await page.getByRole("dialog", { name: "Calculation inspector" }).isVisible()).toBe(
        true,
      );
      expect(await page.title()).toBe("sal");
    } finally {
      await browser?.close();
      child.kill();
      await child.exited;
    }
    expect(await errors).toBe("");
  },
  timeout,
);

const overrides = [["--port", "0"], ["--port=4000"], ["--no-strictPort"]];
it.each(
  ["dev", "preview"].flatMap((task) => overrides.map((arguments_) => ({ task, arguments_ }))),
)(
  "rejects CLI port and fallback overrides: %j",
  async ({ task, arguments_ }) => {
    const child = launchVite(task, arguments_);
    const [code, output, errors] = await Promise.all([
      child.exited,
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
    ]);
    expect(code).not.toBe(0);
    expect(child.signalCode).toBeNull();
    expect(errors).toContain("sal runs on port 2000 only");
    expect(stripVTControlCharacters(output)).not.toMatch(localAddress);
  },
  timeout,
);

for (const { name, launch } of browsers) {
  it(
    `${name} reloads localhost with HTTP cache and service workers bypassed`,
    async () => {
      const child = launchVite("preview", ["--host", "localhost"]);
      const errors = new Response(child.stderr).text();
      let browser: Browser | undefined;
      try {
        await readAddress(child.stdout);
        browser = await launch();
        const context = await browser.newContext({ serviceWorkers: "block" });
        // Playwright routing disables the HTTP cache, matching a hard reload's network path.
        await context.route("**/*", (route) => route.continue());
        const page = await context.newPage();
        page.setDefaultTimeout(actionTimeout);
        const failures: string[] = [];
        const assets = new Set<string>();
        page.on("pageerror", (error) => failures.push(error.message));
        page.on("requestfailed", (request) => failures.push(request.url()));
        page.on("response", (response) => {
          const { pathname } = new URL(response.url());
          if (!pathname.startsWith("/_app/immutable/")) {
            return;
          }
          assets.add(pathname);
          let expected = "javascript";
          if (pathname.endsWith(".css")) {
            expected = "text/css";
          }
          if (
            response.status() !== successStatus ||
            !response.headers()["content-type"]?.includes(expected)
          ) {
            failures.push(
              `${response.status()} ${pathname}: ${response.headers()["content-type"]}`,
            );
          }
        });
        await page.goto("http://localhost:2000/");
        await importFixture(page);
        await page.getByRole("button", { name: "offers", exact: true }).click();
        const reload = async (): Promise<void> => {
          assets.clear();
          await page.reload();
          await page.getByRole("button", { name: "Remote offer", exact: true }).waitFor();
          expect(assets.size).toBeGreaterThan(0);
          expect(failures).toEqual([]);
        };
        await reload();
        await reload();
        await reload();
        await Bun.write(
          `test-results/server-reload-${name}.json`,
          `${JSON.stringify({ browser: name, version: browser.version(), platform: process.platform, runtime: Bun.version, reloads: 3, assets: assets.size, failures })}\n`,
        );
      } finally {
        await browser?.close();
        child.kill();
        await child.exited;
      }
      expect(await errors).toBe("");
    },
    timeout,
  );
}
