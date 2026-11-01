import assert from "node:assert/strict";
import process from "node:process";
import { isDeepStrictEqual } from "node:util";
import type { ConfigValue } from "./config-ast.ts";
import { extractConfiguration } from "./config-ast.ts";

const environmentPrefix = /^Vite(?:Client|Server)\./u;
const sources = ["vite.config.ts", "config/bundler.ts", "config/environments.ts", "config/port.ts"];
const maximumReferencePasses = 20;

function requireRecord(value: unknown): asserts value is Record<string, unknown> {
  assert(
    typeof value === "object" && value !== null && !Array.isArray(value),
    "Expected an object.",
  );
}

function auditEntry(input: unknown, values: Map<string, ConfigValue>): Record<string, unknown> {
  requireRecord(input);
  const { path, state, reason } = input;
  assert(typeof path === "string" && typeof state === "string", "Invalid inventory entry.");
  if (state === "excluded") {
    assert(typeof reason === "string" && reason.length > 10, `Missing exclusion reason: ${path}`);
    return input;
  }
  assert(state === "explicit" || state === "inherited", `Unresolved configuration: ${path}`);
  let canonical = path;
  if (state === "inherited") {
    canonical = path.replace(environmentPrefix, "Vite.");
  }
  const configured = values.get(canonical);
  assert(configured, `Required configuration is absent: ${path}`);
  return { ...input, ...configured };
}

async function configurationValues(): Promise<Map<string, ConfigValue>> {
  const contents = await Promise.all(
    sources.map(async (path) => [path, await Bun.file(path).text()]),
  );
  const values = extractConfiguration(Object.fromEntries(contents));
  const typescript: unknown = await Bun.file("tsconfig.json").json();
  requireRecord(typescript);
  const { compilerOptions } = typescript;
  requireRecord(compilerOptions);
  for (const [name, value] of Object.entries(compilerOptions)) {
    values.set(`TypeScript.${name}`, {
      value: JSON.stringify(value),
      location: `tsconfig.json#compilerOptions.${name}`,
    });
  }
  return values;
}

async function catalogPaths(): Promise<Set<string>> {
  const catalog: unknown = await Bun.file("tooling/evidence/type-catalog.json").json();
  const references: unknown = await Bun.file("tooling/evidence/type-references.json").json();
  assert(Array.isArray(catalog));
  requireRecord(references);
  const paths = new Set<string>();
  for (const entry of catalog) {
    requireRecord(entry);
    const { path } = entry;
    assert(typeof path === "string");
    paths.add(path);
  }
  for (let pass = 0; pass < maximumReferencePasses; pass += 1) {
    const { size } = paths;
    for (const [alias, original] of Object.entries(references)) {
      assert(typeof original === "string");
      for (const path of [...paths]) {
        if (path.startsWith(`${original}.`)) {
          paths.add(alias + path.slice(original.length));
        }
      }
    }
    if (paths.size === size) {
      return paths;
    }
  }
  throw new Error("Configuration type-reference expansion did not converge.");
}

async function checkToolInventory(write: boolean): Promise<void> {
  const values = await configurationValues();
  const expected = await catalogPaths();
  const visited = new Set<string>();
  const files = await Array.fromAsync(new Bun.Glob("tooling/config-inventory/*.json").scan("."));
  await Promise.all(
    files.map(async (path) => {
      const input: unknown = await Bun.file(path).json();
      assert(Array.isArray(input));
      const updated = input.map((entry) => auditEntry(entry, values));
      for (const entry of updated) {
        const { path: propertyPath } = entry;
        assert(
          typeof propertyPath === "string" && !visited.has(propertyPath),
          "Duplicate inventory path.",
        );
        visited.add(propertyPath);
      }
      if (write) {
        await Bun.write(path, `${JSON.stringify(updated, null, 2)}\n`);
      } else {
        assert(isDeepStrictEqual(input, updated), `Stale configuration inventory: ${path}`);
      }
    }),
  );
  assert(
    isDeepStrictEqual(expected, visited),
    "Configuration inventory differs from its type catalogue.",
  );
  process.stdout.write(`Verified ${visited.size} tool configuration properties.\n`);
}

if (import.meta.main) {
  const [, , mode, ...extra] = process.argv;
  assert(extra.length === 0 && (mode === "check" || mode === "write"), "Use check or write.");
  await checkToolInventory(mode === "write");
}

export { auditEntry, checkToolInventory, requireRecord };
