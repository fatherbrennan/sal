import assert from "node:assert/strict";
import process from "node:process";
import { isDeepStrictEqual } from "node:util";
import { requireRecord } from "./config-inventory.ts";

async function verifyHashes(input: unknown): Promise<void> {
  requireRecord(input);
  await Promise.all(
    Object.entries(input).map(async ([path, expected]) => {
      const actual = new Bun.CryptoHasher("sha256")
        .update(await Bun.file(path).arrayBuffer())
        .digest("hex");
      assert.equal(actual, expected, `Configuration surface changed: ${path}`);
    }),
  );
}

async function checkConfigSources(): Promise<void> {
  const manifest: unknown = await Bun.file("tooling/config-sources.json").json();
  const pkg: unknown = await Bun.file("package.json").json();
  requireRecord(manifest);
  requireRecord(pkg);
  const { engines, devDependencies } = pkg;
  const { bun, dependencies, sha256, additionalSha256 } = manifest;
  requireRecord(engines);
  assert.equal(Bun.version, bun, "Bun changed; review its configuration surface.");
  const { bun: engineBun } = engines;
  assert.equal(engineBun, bun, "Bun pin changed; review the configuration inventory.");
  assert(
    isDeepStrictEqual(devDependencies, dependencies),
    "Dependency pins changed; review configurations.",
  );
  requireRecord(sha256);
  const catalog: unknown = await Bun.file("tooling/evidence/type-catalog.json").json();
  assert(Array.isArray(catalog));
  const sourcePaths = catalog.map((entry: unknown) => {
    requireRecord(entry);
    const { source } = entry;
    return source;
  });
  assert(
    isDeepStrictEqual(new Set(Object.keys(sha256)), new Set(sourcePaths)),
    "Declaration source inventory is incomplete.",
  );
  await Promise.all([verifyHashes(sha256), verifyHashes(additionalSha256)]);
  process.stdout.write("Verified pinned configuration declarations and dependency versions.\n");
}

if (import.meta.main) {
  await checkConfigSources();
}

export { checkConfigSources };
