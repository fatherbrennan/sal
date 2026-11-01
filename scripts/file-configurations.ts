import assert from "node:assert/strict";
import { isDeepStrictEqual } from "node:util";
import { requireRecord } from "./config-inventory.ts";

const paths = [
  "bunfig.toml",
  "bunfig.coverage.toml",
  "tsconfig.json",
  "tsconfig.tools.json",
  "tsconfig.worker.json",
];

function verifyFileConfiguration(actual: unknown, reviewed: unknown): void {
  requireRecord(actual);
  requireRecord(reviewed);
  const { explicit, excluded, evidence } = reviewed;
  requireRecord(explicit);
  requireRecord(excluded);
  assert(Array.isArray(evidence) && evidence.length > 0, "Missing configuration evidence.");
  for (const reason of Object.values(excluded)) {
    assert(typeof reason === "string" && reason.length > 10, "Missing exclusion reason.");
  }
  assert(isDeepStrictEqual(actual, explicit), "Configuration differs from its reviewed inventory.");
}

async function checkFileConfigurations(): Promise<void> {
  const inventory: unknown = await Bun.file("tooling/file-configurations.json").json();
  requireRecord(inventory);
  assert(
    isDeepStrictEqual(new Set(Object.keys(inventory)), new Set(paths)),
    "Missing configuration file.",
  );
  await Promise.all(
    paths.map(async (path) => {
      const text = await Bun.file(path).text();
      let actual: unknown;
      if (path.endsWith(".toml")) {
        actual = Bun.TOML.parse(text);
      } else {
        actual = JSON.parse(text);
      }
      verifyFileConfiguration(actual, inventory[path]);
    }),
  );
}

if (import.meta.main) {
  await checkFileConfigurations();
}

export { checkFileConfigurations, verifyFileConfiguration };
