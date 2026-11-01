import { expect, it } from "bun:test";
import { ignoreDependencySourcemap } from "../../config/environments.ts";
import { extractConfiguration } from "../../scripts/config-ast.ts";
import { auditEntry, checkToolInventory, requireRecord } from "../../scripts/config-inventory.ts";
import { checkConfigSources } from "../../scripts/config-sources.ts";
import {
  checkFileConfigurations,
  verifyFileConfiguration,
} from "../../scripts/file-configurations.ts";

it("verifies every reviewed property against the actual configurations and pinned declarations", async () => {
  await expect(checkToolInventory(false)).resolves.toBeUndefined();
  await expect(checkConfigSources()).resolves.toBeUndefined();
  await expect(checkFileConfigurations()).resolves.toBeUndefined();
});

it("rejects a deleted Bun threshold, changed setting, or missing exclusion evidence", async () => {
  const actual = Bun.TOML.parse(await Bun.file("bunfig.toml").text());
  const inventory: unknown = await Bun.file("tooling/file-configurations.json").json();
  requireRecord(inventory);
  const reviewed = inventory["bunfig.toml"];
  expect(() => verifyFileConfiguration(actual, reviewed)).not.toThrow();
  expect(() => verifyFileConfiguration({ ...actual, test: {} }, reviewed)).toThrow("differs");
  expect(() => verifyFileConfiguration({ ...actual, telemetry: true }, reviewed)).toThrow(
    "differs",
  );
  expect(() => verifyFileConfiguration({}, { explicit: {}, excluded: {}, evidence: [] })).toThrow(
    "Missing configuration evidence",
  );
  expect(() =>
    verifyFileConfiguration({}, { explicit: {}, excluded: { foo: "" }, evidence: ["source"] }),
  ).toThrow("Missing exclusion reason");
});

it("detects a removed required setting in the real Vite configuration", async () => {
  const content = await Bun.file("vite.config.ts").text();
  const present = extractConfiguration({ "vite.config.ts": content });
  const missing = extractConfiguration({
    "vite.config.ts": content.replaceAll("strictPort: true,", ""),
  });
  const requirement = { path: "Vite.server.strictPort", state: "explicit" };
  expect(auditEntry(requirement, present)).toHaveProperty("value", "true");
  expect(() => auditEntry(requirement, missing)).toThrow("Required configuration is absent");
});

it("resolves shared objects, overrides, quoted names, methods and environment inheritance", () => {
  const values = extractConfiguration({
    "fixture.ts": `const shared = { nested: { flag: false } } satisfies Options;
const kitOptions = { onwarn() { throw Error(); } };
adapter({ strict: true });
sveltekit(kitOptions);
defineConfig(() => ({ ...shared, 'nested': { ...shared.nested, flag: true },
  environments: {client:{dev:{recoverable:true}},ssr:{dev:{recoverable:false}}} }));`,
  });
  expect(values.get("Vite.nested.flag")?.value).toBe("true");
  expect(values.get("SvelteKit.onwarn")?.value).toContain("throw Error()");
  expect(values.get("StaticAdapter.strict")?.value).toBe("true");
  expect(values.get("ViteClient.dev.recoverable")?.value).toBe("true");
  expect(values.get("ViteServer.dev.recoverable")?.value).toBe("false");
  expect(auditEntry({ path: "ViteClient.nested.flag", state: "inherited" }, values)).toHaveProperty(
    "value",
    "true",
  );
});

it("rejects ambiguous bindings and invalid inventory decisions", () => {
  expect(() =>
    extractConfiguration({ "a.ts": "const duplicate = 1;", "b.ts": "const duplicate = 2;" }),
  ).toThrow("Ambiguous");
  expect(() => requireRecord(null)).toThrow("Expected an object");
  expect(() => auditEntry({}, new Map())).toThrow("Invalid inventory entry");
  expect(() => auditEntry({ path: "X", state: "pending" }, new Map())).toThrow("Unresolved");
  expect(() => auditEntry({ path: "X", state: "excluded" }, new Map())).toThrow(
    "Missing exclusion reason",
  );
  expect(
    auditEntry(
      { path: "X", state: "excluded", reason: "No selected feature uses this variant." },
      new Map(),
    ),
  ).toHaveProperty("state", "excluded");
});

it("ignores dependency source maps on both path styles without ignoring application code", () => {
  expect(ignoreDependencySourcemap("C:\\project\\node_modules\\svelte\\index.js")).toBe(true);
  expect(ignoreDependencySourcemap("/project/node_modules/svelte/index.js")).toBe(true);
  expect(ignoreDependencySourcemap("/project/src/app.ts")).toBe(false);
  expect(ignoreDependencySourcemap("/project/not_node_modules/app.ts")).toBe(false);
});
