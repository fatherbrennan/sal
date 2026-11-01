import adapter from "@sveltejs/adapter-static";
import type { Config } from "@sveltejs/kit/vite";
import { sveltekit } from "@sveltejs/kit/vite";
import type { UserConfig } from "vite";
import { createLogger, defineConfig } from "vite";
import { bundlerOptions } from "./config/bundler.ts";
import {
  clientEnvironment,
  ignoreDependencySourcemap,
  serverEnvironment,
} from "./config/environments.ts";
import { buildBase } from "./config/github-pages.ts";
import { applicationPort, requireFreePort } from "./config/port.ts";

const logger = createLogger("info", { allowClearScreen: false });
logger.warn = (message) => {
  throw new Error(message);
};
logger.warnOnce = logger.warn;

const localOrigin = /^https?:\/\/(?:(?:[^:]+\.)?localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/u;
const nodeModules = /node_modules/u;

const kitOptions = {
  adapter: adapter({ pages: "build", assets: "build", precompress: false, strict: true }),
  appDir: "_app",
  csp: { mode: "auto", directives: {}, reportOnly: {} },
  csrf: { trustedOrigins: [] },
  embedded: false,
  env: { dir: "." },
  experimental: {
    remoteFunctions: false,
    forkPreloads: false,
    sendWarningsToBrowser: false,
    disableSvelteResolveWarnings: false,
    compileModule: { infixes: [".svelte."], extensions: [".ts", ".js"] },
  },
  extensions: [".svelte"],
  inlineStyleThreshold: 0,
  moduleExtensions: [".js", ".ts"],
  outDir: ".svelte-kit",
  output: { linkHeaderPreload: false, bundleStrategy: "split" },
  paths: { base: buildBase(), assets: "", relative: true },
  prerender: {
    concurrency: 1,
    crawl: true,
    entries: ["*"],
    handleHttpError: "fail",
    handleMissingId: "fail",
    handleEntryGeneratorMismatch: "fail",
    handleUnseenRoutes: "fail",
    handleInvalidUrl: "fail",
  },
  router: { type: "pathname", resolution: "client" },
  serviceWorker: { register: true },
  tracing: { server: false },
  version: { pollInterval: 3_600_000 },
  configFile: false,
  include: ["**/*.svelte"],
  exclude: [],
  emitCss: true,
  disableDependencyReinclusion: false,
  inspector: false,
  preprocess: [],
  compilerOptions: {
    experimental: { async: false },
    customElement: false,
    namespace: "html",
    css: "external",
    preserveComments: false,
    preserveWhitespace: false,
    fragments: "html",
    runes: undefined,
    discloseVersion: true,
    modernAst: false,
    warningFilter: () => true,
  },
  onwarn(warning) {
    throw new Error(`${warning.code}: ${warning.message}`);
  },
} satisfies Config;

const viteOptions = {
  root: ".",
  tsconfig: "tsconfig.json",
  cacheDir: "node_modules/.vite",
  define: {},
  assetsInclude: [],
  html: { additionalAssetSources: {} },
  css: {
    transformer: "postcss",
    modules: false,
    preprocessorOptions: {},
    preprocessorMaxWorkers: true,
    devSourcemap: false,
    postcss: { plugins: [] },
  },
  json: { namedExports: true, stringify: "auto" },
  resolve: {
    externalConditions: ["node", "module-sync"],
    extensions: [".mjs", ".js", ".mts", ".ts", ".jsx", ".tsx", ".json"],
    dedupe: [],
    noExternal: [],
    external: [],
    preserveSymlinks: false,
    tsconfigPaths: false,
  },
  optimizeDeps: {
    rolldownOptions: {
      ...bundlerOptions,
      preserveEntrySignatures: "exports-only",
      output: {
        ...bundlerOptions.output,
        assetFileNames: "assets/[name]-[hash][extname]",
        chunkFileNames: "[name]-[hash].js",
      },
    },
    include: [],
    exclude: [],
    needsInterop: [],
    extensions: [],
    holdUntilCrawlEnd: true,
    force: false,
    ignoreOutdatedRequests: false,
    noDiscovery: false,
  },
  build: {
    rolldownOptions: { ...bundlerOptions, logLevel: "info" },
    dynamicImportVarsOptions: { include: [], exclude: [nodeModules] },
    ssrManifest: false,
    ssrEmitAssets: false,
    target: "baseline-widely-available",
    modulePreload: { polyfill: true },
    assetsDir: "assets",
    assetsInlineLimit: 4096,
    cssTarget: ["chrome111", "edge111", "firefox114", "safari16.4"],
    chunkImportMap: false,
    write: true,
    copyPublicDir: true,
    license: false,
    reportCompressedSize: true,
    chunkSizeWarningLimit: 500,
    watch: null,
  },
  legacy: { skipWebSocketTokenCheck: false, inconsistentCjsInterop: false },
  logLevel: "info",
  customLogger: logger,
  clearScreen: false,
  envDir: false,
  envPrefix: "VITE_",
  devtools: false,
  server: {
    port: applicationPort,
    strictPort: true,
    host: "localhost",
    allowedHosts: [],
    open: false,
    proxy: {},
    headers: {},
    warmup: { clientFiles: [], ssrFiles: [] },
    middlewareMode: false,
    preTransformRequests: true,
    perEnvironmentStartEndDuringDev: false,
    perEnvironmentWatchChangeDuringDev: false,
    forwardConsole: { unhandledErrors: true, logLevels: ["error", "warn"] },
    fs: {
      strict: true,
      deny: [
        ".env",
        ".env.*",
        "*.{crt,pem,key,p12,pfx,cer,der}",
        ".npmrc",
        ".yarnrc.yml",
        "**/.git/**",
      ],
    },
    hmr: { overlay: true },
    ws: { timeout: 30_000 },
    watch: {
      ignored: ["**/.cache/**", "**/coverage/**", "**/tooling/evidence/**"],
      persistent: true,
      ignoreInitial: true,
      followSymlinks: true,
      disableGlobbing: false,
      alwaysStat: false,
      interval: 100,
      binaryInterval: 300,
      ignorePermissionErrors: true,
      awaitWriteFinish: false,
    },
  },
  preview: {
    port: applicationPort,
    strictPort: true,
    host: "localhost",
    allowedHosts: [],
    open: false,
    proxy: {},
    headers: {},
    cors: {
      origin: localOrigin,
      methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
      credentials: false,
      preflightContinue: true,
      optionsSuccessStatus: 204,
    },
  },
  experimental: { importGlobRestoreExtension: false, bundledDev: false },
  builder: { sharedConfigBuild: false, sharedPlugins: false },
  ssr: { target: "node" },
  dev: {
    warmup: [],
    sourcemap: { js: true, css: false },
    sourcemapIgnoreList: ignoreDependencySourcemap,
  },
  oxc: {
    define: {},
    assumptions: {
      ignoreFunctionLength: false,
      noDocumentAll: false,
      objectRestNoSymbols: false,
      pureGetters: false,
      setPublicClassFields: false,
    },
    typescript: {
      onlyRemoveTypeImports: true,
      allowNamespaces: true,
      removeClassFieldsWithoutInitializer: false,
      optimizeConstEnums: false,
      optimizeEnums: false,
      rewriteImportExtensions: false,
    },
    decorator: { legacy: false, emitDecoratorMetadata: false, strictNullChecks: true },
  },
} satisfies UserConfig;

export default defineConfig(({ command }) => ({
  ...viteOptions,
  plugins: [
    {
      name: "sal-port",
      configResolved(config) {
        for (const options of [config.server, config.preview]) {
          if (options.port !== applicationPort || !options.strictPort) {
            throw new Error("sal runs on port 2000 only, with strictPort enabled.");
          }
        }
      },
      configureServer: requireFreePort,
      configurePreviewServer: requireFreePort,
    },
    sveltekit({
      ...kitOptions,
      prebundleSvelteLibraries: command === "serve",
    }),
  ],
  environments: {
    client: { ...clientEnvironment, isBundled: command === "build" },
    ssr: { ...serverEnvironment, isBundled: command === "build" },
  },
}));

export { kitOptions };
