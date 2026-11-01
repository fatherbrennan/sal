import { version } from "$app/env";
import { assets, immutable, prerendered } from "$app/manifest";
import { self } from "$app/service-worker";

const prefix = "sal-assets-";
const cacheName = prefix + version;
const root = new URL(self.registration.scope);
const leadingSlash = /^\//u;
const resources = [
  ...new Set([
    root.href,
    ...[...assets, ...immutable, ...prerendered]
      .filter(({ path }) => path.replace(leadingSlash, "") !== ".gitkeep")
      .map(({ path }) => new URL(path.replace(leadingSlash, ""), root).href),
  ]),
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await self.caches.open(cacheName);
      await cache.addAll(resources);
    })(),
  );
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await self.caches.keys();
      await Promise.all(
        names
          .filter((name) => name.startsWith(prefix) && name !== cacheName)
          .map((name) => self.caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});
self.addEventListener("message", (event) => {
  if (event.data === "activate-sal-update") {
    event.waitUntil(self.skipWaiting());
  }
});
async function cached(request: Request): Promise<Response> {
  const cache = await self.caches.open(cacheName);
  let key = request.url;
  if (request.mode === "navigate" && !resources.includes(key)) {
    key = root.href;
  }
  const match = await cache.match(key);
  if (match !== undefined) {
    return match;
  }
  return await self.fetch(request);
}
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (
    request.method === "GET" &&
    url.origin === root.origin &&
    (resources.includes(url.href) || request.mode === "navigate")
  ) {
    event.respondWith(cached(request));
  }
});
