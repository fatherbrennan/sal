import { expect, it } from "bun:test";
import { compile } from "svelte/compiler";
import { resolveConfig } from "vite";
import { csr, prerender, ssr } from "../../src/routes/+layout.ts";

const expectedPort = 2000;

it("requires client rendering and a prerendered static entry", () => {
  expect(ssr).toBe(false);
  expect(csr).toBe(true);
  expect(prerender).toBe(true);
});

it("preserves compiler warnings and rejects them as build errors", async () => {
  const path = "../../vite.config.ts";
  const module: unknown = await import(path);
  if (
    typeof module !== "object" ||
    module === null ||
    !("kitOptions" in module) ||
    typeof module.kitOptions !== "object" ||
    module.kitOptions === null
  ) {
    throw new Error("Missing Svelte configuration.");
  }
  const { kitOptions } = module;
  if (
    !("onwarn" in kitOptions) ||
    typeof kitOptions.onwarn !== "function" ||
    !("compilerOptions" in kitOptions) ||
    typeof kitOptions.compilerOptions !== "object" ||
    kitOptions.compilerOptions === null
  ) {
    throw new Error("Missing compiler warning policy.");
  }
  const { onwarn, compilerOptions } = kitOptions;
  if (
    !("warningFilter" in compilerOptions) ||
    typeof compilerOptions.warningFilter !== "function"
  ) {
    throw new Error("Missing explicit warning filter.");
  }
  const { warnings } = compile("<p>Example</p><style>.unused { color: red; }</style>", {});
  const [warning] = warnings;
  expect(warning?.code).toBe("css_unused_selector");
  expect(compilerOptions.warningFilter(warning)).toBe(true);
  expect(() => onwarn(warning)).toThrow("css_unused_selector");
});

it.each(["serve", "build"])(
  "loads the TypeScript Vite configuration with Bun for %s",
  async (command) => {
    const path = "../../vite.config.ts";
    const module: unknown = await import(path);
    expect(module).toHaveProperty("default");
    if (
      typeof module !== "object" ||
      module === null ||
      !("default" in module) ||
      typeof module.default !== "function"
    ) {
      throw new Error("Vite requires a callable default configuration export.");
    }
    const configuration: unknown = module.default({
      command,
      mode: "production",
      isSsrBuild: false,
      isPreview: false,
    });
    expect(configuration).toHaveProperty("plugins");
    expect(configuration).toHaveProperty("envDir", false);
    expect(configuration).toHaveProperty("server.port", expectedPort);
    expect(configuration).toHaveProperty("server.strictPort", true);
    expect(configuration).toHaveProperty("preview.port", expectedPort);
    expect(configuration).toHaveProperty("preview.strictPort", true);
    if (
      typeof configuration !== "object" ||
      configuration === null ||
      !("customLogger" in configuration)
    ) {
      throw new Error("Missing build logger.");
    }
    const { customLogger } = configuration;
    if (
      typeof customLogger !== "object" ||
      customLogger === null ||
      !("warn" in customLogger) ||
      typeof customLogger.warn !== "function" ||
      !("warnOnce" in customLogger) ||
      typeof customLogger.warnOnce !== "function"
    ) {
      throw new Error("Missing warning enforcement.");
    }
    const { warn, warnOnce } = customLogger;
    expect(() => warn("Warning fixture")).toThrow("Warning fixture");
    expect(() => warnOnce("Warning fixture")).toThrow("Warning fixture");
  },
);

it.each([
  { server: { port: 0 } },
  { server: { port: 4000 } },
  { preview: { port: 0 } },
  { preview: { port: 4000 } },
  { server: { strictPort: false } },
  { preview: { strictPort: false } },
])("rejects port and fallback overrides: %j", async (override) => {
  // Measure the authored configuration instead of Vite's temporary bundle.
  await expect(resolveConfig({ ...override, configLoader: "native" }, "serve")).rejects.toThrow(
    "sal runs on port 2000 only",
  );
});

it.each(["127.0.0.1", "::1"])(
  "allows configuration inspection while %s is serving on port 2000",
  async (host) => {
    const occupant = Bun.serve({
      hostname: host,
      port: expectedPort,
      fetch: () => new Response("Existing server"),
    });
    try {
      const config = await resolveConfig({ configLoader: "native" }, "build");
      expect(config.command).toBe("build");
      expect(await (await fetch(occupant.url)).text()).toBe("Existing server");
    } finally {
      await occupant.stop(true);
    }
  },
);
