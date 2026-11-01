// Worker-only declarations mirror the consumed virtual exports in pinned SvelteKit 3.1.0.
declare module "$app/env" {
  export const version: string;
}
declare module "$app/manifest" {
  export const assets: Array<{ path: string }>;
  export const immutable: Array<{ path: string }>;
  export const prerendered: Array<{ path: string }>;
}
declare module "$app/service-worker" {
  export const self: ServiceWorkerGlobalScope;
}
