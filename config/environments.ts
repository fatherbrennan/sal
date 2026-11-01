import { builtinModules } from "node:module";
import type { EnvironmentOptions } from "vite";

const dependencyPath = /(?:^|[\\/])node_modules(?:[\\/]|$)/u;

function ignoreDependencySourcemap(path: string): boolean {
  return dependencyPath.test(path);
}

const clientEnvironment = {
  consumer: "client",
  keepProcessEnv: false,
  resolve: {
    mainFields: ["browser", "module", "jsnext:main", "jsnext"],
    conditions: ["module", "browser", "development|production"],
    builtins: [],
  },
  dev: {
    preTransformRequests: true,
    recoverable: true,
    moduleRunnerTransform: false,
  },
  build: { minify: "oxc", cssMinify: true, sourcemap: false, emitAssets: true },
} satisfies EnvironmentOptions;

const serverEnvironment = {
  consumer: "server",
  keepProcessEnv: true,
  resolve: {
    mainFields: ["module", "jsnext:main", "jsnext"],
    conditions: ["module", "node", "development|production"],
    builtins: [...builtinModules.filter((name) => !name.includes(":")), /^node:/u, /^bun:/u],
  },
  optimizeDeps: {
    include: [],
    exclude: [],
    needsInterop: [],
    extensions: [],
    noDiscovery: true,
    holdUntilCrawlEnd: true,
    ignoreOutdatedRequests: false,
    force: false,
  },
  dev: {
    preTransformRequests: false,
    recoverable: false,
    moduleRunnerTransform: true,
  },
  build: { minify: false, cssMinify: "lightningcss", sourcemap: true, emitAssets: false },
} satisfies EnvironmentOptions;

export { clientEnvironment, ignoreDependencySourcemap, serverEnvironment };
