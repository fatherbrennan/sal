import { expect, it, mock } from "bun:test";
import assert from "node:assert/strict";

interface WorkerEvent {
  request: Request;
  data: unknown;
  waitUntil: (promise: Promise<unknown>) => void;
  respondWith: (promise: Promise<Response>) => void;
}
const listeners = new Map<string, (event: WorkerEvent) => void>();
const responses = new Map<string, Response>();
const names = new Set(["sal-assets-old", "unrelated-cache"]);
const fetched: string[] = [];
let claimed = false;
let activated = false;
const worker = {
  registration: { scope: "https://sal.test/app/" },
  addEventListener: (name: string, listener: (event: WorkerEvent) => void) =>
    listeners.set(name, listener),
  caches: {
    open: (name: string) => {
      names.add(name);
      return Promise.resolve({
        addAll: (urls: string[]) => {
          for (const url of urls) {
            responses.set(url, new Response(url));
          }
          return Promise.resolve();
        },
        match: (key: string) => Promise.resolve(responses.get(key)?.clone()),
      });
    },
    keys: () => Promise.resolve([...names]),
    delete: (name: string) => Promise.resolve(names.delete(name)),
  },
  clients: {
    claim: () => {
      claimed = true;
      return Promise.resolve();
    },
  },
  skipWaiting: () => {
    activated = true;
    return Promise.resolve();
  },
  fetch: (request: Request) => {
    fetched.push(request.url);
    return Promise.resolve(new Response("network fallback"));
  },
};
mock.module("$app/env", () => ({ version: "test-version" }));
mock.module("$app/manifest", () => ({
  assets: [{ path: "/icon.svg" }, { path: ".gitkeep" }],
  immutable: [{ path: "/app.js" }],
  prerendered: [{ path: "/" }, { path: "/cached-page" }],
}));
mock.module("$app/service-worker", () => ({ self: worker }));

async function dispatch(
  name: string,
  request = new Request(worker.registration.scope),
  data: unknown = null,
): Promise<Response | null> {
  let completion: Promise<unknown> = Promise.resolve();
  let response: Promise<Response> | null = null;
  const listener = listeners.get(name);
  assert(listener !== undefined);
  listener({
    request,
    data,
    waitUntil: (task) => {
      completion = task;
    },
    respondWith: (task) => {
      response = task;
    },
  });
  await completion;
  return await response;
}

it("installs the complete asset set, serves cached navigation, and activates only on request", async () => {
  const entry = "../../src/service-worker/index.ts";
  await import(entry);
  await dispatch("install");
  expect([...responses.keys()].sort((a, b) => a.localeCompare(b))).toEqual([
    "https://sal.test/app/",
    "https://sal.test/app/app.js",
    "https://sal.test/app/cached-page",
    "https://sal.test/app/icon.svg",
  ]);
  await dispatch("activate");
  expect(claimed).toBe(true);
  expect([...names].sort((a, b) => a.localeCompare(b))).toEqual([
    "sal-assets-test-version",
    "unrelated-cache",
  ]);
  const navigation = new Request("https://sal.test/app/comparison");
  Object.defineProperty(navigation, "mode", { value: "navigate" });
  expect(await (await dispatch("fetch", navigation))?.text()).toBe("https://sal.test/app/");
  const cachedPage = new Request("https://sal.test/app/cached-page");
  Object.defineProperty(cachedPage, "mode", { value: "navigate" });
  expect(await (await dispatch("fetch", cachedPage))?.text()).toBe(cachedPage.url);
  const asset = new Request("https://sal.test/app/app.js");
  expect(await (await dispatch("fetch", asset))?.text()).toBe(asset.url);
  responses.delete(asset.url);
  expect(await (await dispatch("fetch", asset))?.text()).toBe("network fallback");
  expect(fetched).toEqual([asset.url]);
  expect(await dispatch("fetch", new Request("https://other.test/"))).toBeNull();
  expect(await dispatch("fetch", new Request("https://sal.test/app/unknown"))).toBeNull();
  expect(await dispatch("fetch", new Request(asset.url, { method: "POST" }))).toBeNull();
  await dispatch("message", asset, "unrelated-message");
  expect(activated).toBe(false);
  await dispatch("message", asset, "activate-sal-update");
  expect(activated).toBe(true);
});
